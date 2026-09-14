from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.book import Book
from app.models.graph import GraphEdge, GraphNode
from app.models.note import Note
from app.models.quiz import QuizItem
from app.models.tracker import ReadingSession
from app.schemas.book import BookIndexResult, BookPageText, BookRead, BookSyncResult, BookTextExtraction, BookUpdate
from app.services.book_files import is_pdf_file, resolve_book_file_path
from app.services.pdf_parser import PDFParseError, extract_pdf_metadata, extract_pdf_text, update_pdf_title_metadata
from app.services.vector_store import VectorStoreError, delete_book_collection, index_book_text
from app.time import utc_now

router = APIRouter()

MAX_UPLOAD_SIZE = 100 * 1024 * 1024


@router.get("", response_model=list[BookRead])
async def list_books(db: AsyncSession = Depends(get_db)) -> list[Book]:
    result = await db.execute(select(Book).order_by(Book.created_at.desc()))
    return list(result.scalars().all())


@router.post("/sync", response_model=BookSyncResult)
async def sync_books(db: AsyncSession = Depends(get_db)) -> BookSyncResult:
    settings = get_settings()
    books_dir = Path(settings.assets_books_dir).resolve()

    if not books_dir.exists():
        raise HTTPException(status_code=404, detail=f"Books folder not found: {books_dir}")

    pdf_paths = sorted(books_dir.rglob("*.pdf"))
    created = 0
    updated = 0
    skipped = 0
    synced_books: list[Book] = []

    for pdf_path in pdf_paths:
        if not pdf_path.is_file():
            skipped += 1
            continue

        relative_path = pdf_path.relative_to(books_dir).as_posix()
        category = pdf_path.relative_to(books_dir).parts[0] if len(pdf_path.relative_to(books_dir).parts) > 1 else "Other"
        metadata = extract_pdf_metadata(pdf_path)
        file_size = pdf_path.stat().st_size

        result = await db.execute(select(Book).where(Book.file_path == relative_path))
        book = result.scalar_one_or_none()

        if book is None:
            book = Book(
                title=str(metadata["title"] or pdf_path.stem),
                author=metadata["author"] if isinstance(metadata["author"], str) else None,
                file_path=relative_path,
                file_size=file_size,
                page_count=metadata["page_count"] if isinstance(metadata["page_count"], int) else None,
                category=category,
            )
            db.add(book)
            created += 1
        else:
            book.title = str(metadata["title"] or pdf_path.stem)
            book.author = metadata["author"] if isinstance(metadata["author"], str) else None
            book.file_size = file_size
            book.page_count = metadata["page_count"] if isinstance(metadata["page_count"], int) else None
            book.category = category
            book.updated_at = utc_now()
            updated += 1

        synced_books.append(book)

    await db.commit()

    for book in synced_books:
        await db.refresh(book)

    return BookSyncResult(
        scanned=len(pdf_paths),
        created=created,
        updated=updated,
        skipped=skipped,
        books=synced_books,
    )


@router.post("/upload", response_model=BookRead)
async def upload_book(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)) -> Book:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    original_filename = Path(file.filename or "uploaded.pdf").name
    if not original_filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Uploaded file must use the .pdf extension.")

    settings = get_settings()
    upload_dir = Path(settings.upload_dir).resolve()
    upload_dir.mkdir(parents=True, exist_ok=True)

    stored_filename = f"{uuid4()}.pdf"
    stored_path = upload_dir / stored_filename
    size = 0

    try:
        with stored_path.open("wb") as output:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_UPLOAD_SIZE:
                    output.close()
                    stored_path.unlink(missing_ok=True)
                    raise HTTPException(status_code=413, detail="PDF uploads must be 100MB or smaller.")
                output.write(chunk)
    finally:
        await file.close()

    metadata = extract_pdf_metadata(stored_path)
    book = Book(
        title=str(metadata["title"] or Path(original_filename).stem),
        author=metadata["author"] if isinstance(metadata["author"], str) else None,
        file_path=f"uploads/{stored_filename}",
        file_size=size,
        page_count=metadata["page_count"] if isinstance(metadata["page_count"], int) else None,
        category="Uploaded",
    )
    db.add(book)
    await db.commit()
    await db.refresh(book)

    return book


@router.patch("/{book_id}", response_model=BookRead)
async def update_book(book_id: str, update: BookUpdate, db: AsyncSession = Depends(get_db)) -> Book:
    title = update.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Book title cannot be empty.")

    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found.")

    file_path = resolve_book_file_path(book.file_path)
    if file_path is None or not file_path.exists():
        raise HTTPException(status_code=404, detail="Book file not found.")
    if not is_pdf_file(file_path):
        raise HTTPException(status_code=422, detail="Stored book file is not a valid PDF.")

    try:
        update_pdf_title_metadata(file_path, title)
    except PDFParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    book.title = title
    book.updated_at = utc_now()
    await db.commit()
    await db.refresh(book)
    return book


@router.get("/{book_id}/text", response_model=BookTextExtraction)
async def get_book_text(
    book_id: str,
    page_from: int | None = Query(default=None, ge=1),
    page_to: int | None = Query(default=None, ge=1),
    db: AsyncSession = Depends(get_db),
) -> BookTextExtraction:
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()

    if book is None:
        raise HTTPException(status_code=404, detail="Book not found.")

    file_path = resolve_book_file_path(book.file_path)
    if file_path is None or not file_path.exists():
        raise HTTPException(status_code=404, detail="Book file not found.")

    try:
        extraction = extract_pdf_text(file_path, page_from=page_from, page_to=page_to)
    except PDFParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return BookTextExtraction(
        book_id=book.id,
        title=extraction.title or book.title,
        author=extraction.author or book.author,
        page_count=extraction.page_count,
        page_from=extraction.pages[0].page_number if extraction.pages else 0,
        page_to=extraction.pages[-1].page_number if extraction.pages else 0,
        total_char_count=extraction.total_char_count,
        total_word_count=extraction.total_word_count,
        pages=[
            BookPageText(
                page_number=page.page_number,
                text=page.text,
                char_count=page.char_count,
                word_count=page.word_count,
            )
            for page in extraction.pages
        ],
    )


@router.post("/{book_id}/index", response_model=BookIndexResult)
async def index_book(book_id: str, db: AsyncSession = Depends(get_db)) -> BookIndexResult:
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()

    if book is None:
        raise HTTPException(status_code=404, detail="Book not found.")

    file_path = resolve_book_file_path(book.file_path)
    if file_path is None or not file_path.exists():
        raise HTTPException(status_code=404, detail="Book file not found.")

    settings = get_settings()
    if not settings.has_openrouter_api_key and not settings.has_gemini_api_key:
        raise HTTPException(status_code=422, detail="OPENROUTER_API_KEY or GEMINI_API_KEY is required to index book text.")

    try:
        extraction = extract_pdf_text(file_path)
        index_result = index_book_text(
            book_id=book.id,
            extraction=extraction,
            persist_dir=settings.chroma_persist_dir,
            gemini_api_key=settings.gemini_api_key if settings.has_gemini_api_key else "",
            openrouter_api_key=settings.openrouter_api_key if settings.has_openrouter_api_key else "",
            embedding_model_name=settings.gemini_embedding_model,
            openrouter_embedding_model_name=settings.openrouter_embedding_model,
            openrouter_app_name=settings.openrouter_app_name,
        )
    except PDFParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except VectorStoreError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    book.is_indexed = True
    book.updated_at = utc_now()
    await db.commit()
    await db.refresh(book)

    return BookIndexResult(
        book_id=index_result.book_id,
        collection_name=index_result.collection_name,
        chunk_count=index_result.chunk_count,
        page_count=index_result.page_count,
        is_indexed=book.is_indexed,
    )


@router.get("/{book_id}/file")
async def get_book_file(book_id: str, db: AsyncSession = Depends(get_db)) -> FileResponse:
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()

    if book is None:
        raise HTTPException(status_code=404, detail="Book not found.")

    file_path = resolve_book_file_path(book.file_path)
    if file_path is None or not file_path.exists():
        raise HTTPException(status_code=404, detail="Book file not found.")
    if not is_pdf_file(file_path):
        raise HTTPException(status_code=422, detail="Stored book file is not a valid PDF.")

    return FileResponse(file_path, media_type="application/pdf", filename=file_path.name)


@router.delete("/{book_id}", status_code=204)
async def delete_book(book_id: str, db: AsyncSession = Depends(get_db)) -> None:
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()

    if book is None:
        raise HTTPException(status_code=404, detail="Book not found.")

    settings = get_settings()
    file_path = resolve_book_file_path(book.file_path)

    graph_node_ids = await db.execute(select(GraphNode.id).where(GraphNode.book_id == book_id))
    node_ids = list(graph_node_ids.scalars().all())
    if node_ids:
        await db.execute(delete(GraphEdge).where(GraphEdge.source_id.in_(node_ids) | GraphEdge.target_id.in_(node_ids)))
    await db.execute(delete(GraphNode).where(GraphNode.book_id == book_id))
    await db.execute(delete(Note).where(Note.book_id == book_id))
    await db.execute(delete(QuizItem).where(QuizItem.book_id == book_id))
    await db.execute(delete(ReadingSession).where(ReadingSession.book_id == book_id))
    await db.delete(book)
    await db.commit()

    if book.file_path.startswith("uploads/") and file_path is not None:
        file_path.unlink(missing_ok=True)
    delete_book_collection(book_id, settings.chroma_persist_dir)

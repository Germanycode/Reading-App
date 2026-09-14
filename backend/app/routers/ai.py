import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.book import Book
from app.models.graph import GraphEdge, GraphNode
from app.models.note import Note
from app.models.quiz import QuizItem
from app.models.summary import BookSummary
from app.schemas.ai import (
    ChatRequest,
    ChatResponse,
    ChatSource,
    EntityExtractionRequest,
    EntityExtractionResponse,
    FullBookSummaryRequest,
    SummarizeRequest,
)
from app.schemas.quiz import QuizQuestion, QuizRequest
from app.services.ai_service import (
    AIServiceError,
    build_book_context,
    extract_entities_from_text,
    generate_chat_answer,
    generate_chat_answer_from_context,
    generate_full_pdf_summary_with_gemini,
    generate_full_book_summary,
    generate_quiz_questions,
    stream_summary,
)
from app.services.book_files import resolve_book_file_path
from app.services.pdf_parser import PDFParseError, extract_pdf_text
from app.services.rate_limiter import limit_ai_requests
from app.services.vector_store import VectorStoreError, index_book_text, search_book_text

router = APIRouter()
DEFAULT_AI_PAGE_WINDOW = 20


@router.post("/summarize", dependencies=[Depends(limit_ai_requests)])
async def summarize(request: SummarizeRequest, db: AsyncSession = Depends(get_db)) -> StreamingResponse:
    result = await db.execute(select(Book).where(Book.id == request.book_id))
    book = result.scalar_one_or_none()

    if book is None:
        raise HTTPException(status_code=404, detail="Book not found.")

    file_path = resolve_book_file_path(book.file_path)
    if file_path is None or not file_path.exists():
        raise HTTPException(status_code=404, detail="Book file not found.")

    try:
        page_from, page_to = normalize_ai_page_range(request.page_from, request.page_to)
        extraction = extract_pdf_text(file_path, page_from=page_from, page_to=page_to)
        context = build_book_context(
            [(page.page_number, page.text) for page in extraction.pages],
            max_chars=request.max_context_chars,
        )
    except PDFParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except AIServiceError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    settings = get_settings()
    if not settings.has_gemini_api_key:
        raise HTTPException(status_code=422, detail="GEMINI_API_KEY is required to summarize book text.")

    async def summary_stream():
        try:
            async for chunk in stream_summary(
                context=context,
                gemini_api_key=settings.gemini_api_key,
                model_name=settings.gemini_summary_model,
            ):
                yield chunk
        except AIServiceError as exc:
            yield f"\n\nError: {exc}"
        except PDFParseError as exc:
            yield f"\n\nError: {exc}"

    return StreamingResponse(summary_stream(), media_type="text/markdown")


@router.post("/summarize-full", dependencies=[Depends(limit_ai_requests)])
async def summarize_full_book(request: FullBookSummaryRequest, db: AsyncSession = Depends(get_db)) -> StreamingResponse:
    result = await db.execute(select(Book).where(Book.id == request.book_id))
    book = result.scalar_one_or_none()

    if book is None:
        raise HTTPException(status_code=404, detail="Book not found.")

    file_path = resolve_book_file_path(book.file_path)
    if file_path is None or not file_path.exists():
        raise HTTPException(status_code=404, detail="Book file not found.")

    settings = get_settings()
    if not settings.has_openrouter_api_key and not settings.has_gemini_api_key:
        raise HTTPException(status_code=422, detail="OPENROUTER_API_KEY or GEMINI_API_KEY is required to summarize the full book.")

    cached_summary = await get_cached_full_book_summary(db, book.id, settings.gemini_summary_model)
    if cached_summary is not None:
        return StreamingResponse(iter_text(cached_summary.summary), media_type="text/markdown")

    async def summary_stream():
        try:
            yield "Generating full-book study guide from the PDF...\n\n"
            summary = await generate_full_pdf_summary(book, file_path, request, settings)
            await save_full_book_summary(db, book.id, settings.gemini_summary_model, summary)
            yield summary
        except AIServiceError as exc:
            yield f"\n\nError: {exc}"

    return StreamingResponse(summary_stream(), media_type="text/markdown")


@router.post("/quiz", response_model=list[QuizQuestion], dependencies=[Depends(limit_ai_requests)])
async def generate_quiz(request: QuizRequest, db: AsyncSession = Depends(get_db)) -> list[QuizQuestion]:
    result = await db.execute(select(Book).where(Book.id == request.book_id))
    book = result.scalar_one_or_none()

    if book is None:
        raise HTTPException(status_code=404, detail="Book not found.")

    file_path = resolve_book_file_path(book.file_path)
    if file_path is None or not file_path.exists():
        raise HTTPException(status_code=404, detail="Book file not found.")

    settings = get_settings()
    if not settings.has_gemini_api_key:
        raise HTTPException(status_code=422, detail="GEMINI_API_KEY is required to generate quiz questions.")

    try:
        page_from, page_to = normalize_ai_page_range(request.page_from, request.page_to)
        extraction = extract_pdf_text(file_path, page_from=page_from, page_to=page_to)
        context = build_book_context(
            [(page.page_number, page.text) for page in extraction.pages],
            max_chars=request.max_context_chars,
        )
        questions = await generate_quiz_questions(
            context=context,
            num_questions=request.num_questions,
            gemini_api_key=settings.gemini_api_key,
            model_name=settings.gemini_summary_model,
        )
    except PDFParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except AIServiceError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    for question in questions:
        db.add(
            QuizItem(
                book_id=book.id,
                question=question.question,
                options=json.dumps(question.options),
                answer=question.answer,
                explanation=question.explanation,
                difficulty=request.difficulty,
            )
        )

    await db.commit()

    return questions


@router.post("/entities", response_model=EntityExtractionResponse, dependencies=[Depends(limit_ai_requests)])
async def extract_entities(request: EntityExtractionRequest, db: AsyncSession = Depends(get_db)) -> EntityExtractionResponse:
    result = await db.execute(select(Note).where(Note.id == request.note_id))
    note = result.scalar_one_or_none()

    if note is None:
        raise HTTPException(status_code=404, detail="Note not found.")

    settings = get_settings()
    if not settings.has_gemini_api_key:
        raise HTTPException(status_code=422, detail="GEMINI_API_KEY is required to extract knowledge graph entities.")

    source_text = "\n\n".join(part for part in [note.highlight, note.content] if part and part.strip())
    try:
        entities, relations = await extract_entities_from_text(
            text=source_text,
            gemini_api_key=settings.gemini_api_key,
            model_name=settings.gemini_quick_model,
        )
    except AIServiceError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    node_by_label = await load_graph_nodes_by_label(db)
    created_or_touched_nodes: dict[str, GraphNode] = {}

    for entity in entities:
        node = await get_or_create_graph_node(entity, note, node_by_label, db)
        created_or_touched_nodes[entity.lower()] = node

    edge_count = 0
    for source_label, relation, target_label in relations:
        source_node = created_or_touched_nodes.get(source_label.lower())
        if source_node is None:
            source_node = await get_or_create_graph_node(source_label, note, node_by_label, db)
            created_or_touched_nodes[source_label.lower()] = source_node

        target_node = created_or_touched_nodes.get(target_label.lower())
        if target_node is None:
            target_node = await get_or_create_graph_node(target_label, note, node_by_label, db)
            created_or_touched_nodes[target_label.lower()] = target_node

        created = await create_graph_edge_if_missing(source_node, target_node, relation, db)
        if created:
            edge_count += 1

    await db.commit()

    return EntityExtractionResponse(
        entities=entities,
        relations=relations,
        node_count=len(created_or_touched_nodes),
        edge_count=edge_count,
    )


@router.post("/chat", dependencies=[Depends(limit_ai_requests)])
async def chat_with_book(request: ChatRequest, db: AsyncSession = Depends(get_db)) -> ChatResponse:
    result = await db.execute(select(Book).where(Book.id == request.book_id))
    book = result.scalar_one_or_none()

    if book is None:
        raise HTTPException(status_code=404, detail="Book not found.")

    file_path = resolve_book_file_path(book.file_path)
    if file_path is None or not file_path.exists():
        raise HTTPException(status_code=404, detail="Book file not found.")

    settings = get_settings()
    if not settings.has_gemini_api_key:
        raise HTTPException(status_code=422, detail="GEMINI_API_KEY is required to chat with a book.")

    try:
        if not book.is_indexed:
            page_from, page_to = normalize_ai_page_range(None, None)
            extraction = extract_pdf_text(file_path, page_from=page_from, page_to=page_to)
            context = build_book_context(
                [(page.page_number, page.text) for page in extraction.pages],
                max_chars=24000,
            )
            answer = await generate_chat_answer_from_context(
                question=request.question,
                context=context,
                gemini_api_key=settings.gemini_api_key,
                model_name=settings.gemini_chat_model,
            )
            return ChatResponse(
                answer=f"{answer}\n\nNote: this book is not indexed for semantic search yet, so I answered from the first {DEFAULT_AI_PAGE_WINDOW} pages. Use Library > Index for Search for full-book answers.",
                sources=[
                    ChatSource(
                        page_number=page.page_number,
                        chunk_index=0,
                        score=None,
                        text=page.text[:1200],
                    )
                    for page in extraction.pages
                    if page.text.strip()
                ][: request.limit],
            )

        matches = search_book_text(
            book_id=book.id,
            query=request.question,
            persist_dir=settings.chroma_persist_dir,
            gemini_api_key=settings.gemini_api_key if settings.has_gemini_api_key else "",
            openrouter_api_key=settings.openrouter_api_key if settings.has_openrouter_api_key else "",
            limit=request.limit,
            embedding_model_name=settings.gemini_embedding_model,
            openrouter_embedding_model_name=settings.openrouter_embedding_model,
            openrouter_app_name=settings.openrouter_app_name,
        )
        answer = await generate_chat_answer(
            question=request.question,
            matches=matches,
            gemini_api_key=settings.gemini_api_key,
            model_name=settings.gemini_chat_model,
        )
    except PDFParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except VectorStoreError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except AIServiceError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return ChatResponse(
        answer=answer,
        sources=[
            ChatSource(
                page_number=match.page_number,
                chunk_index=match.chunk_index,
                score=match.score,
                text=match.text,
            )
            for match in matches
        ],
    )


async def generate_full_pdf_summary(book: Book, file_path: Path, request: FullBookSummaryRequest, settings) -> str:
    if settings.has_gemini_api_key:
        try:
            return await generate_full_pdf_summary_with_gemini(
                file_path=str(file_path),
                gemini_api_key=settings.gemini_api_key,
                model_name=settings.gemini_summary_model,
            )
        except AIServiceError:
            if not settings.has_openrouter_api_key:
                raise

    extraction = extract_pdf_text(file_path)
    fallback_summary = await generate_full_book_summary(
        page_texts=[(page.page_number, page.text) for page in extraction.pages],
        openrouter_api_key=settings.openrouter_api_key if settings.has_openrouter_api_key else "",
        openrouter_model_name=settings.openrouter_chat_model,
        openrouter_app_name=settings.openrouter_app_name,
        gemini_api_key=settings.gemini_api_key if settings.has_gemini_api_key else "",
        gemini_model_name=settings.gemini_summary_model,
        pages_per_chunk=request.pages_per_chunk,
        max_chunk_chars=request.max_chunk_chars,
        max_parallel_requests=request.max_parallel_requests,
    )
    return (
        f"{fallback_summary}\n\n"
        "Note: Gemini native PDF summarization was unavailable, so this summary used the extracted-text fallback."
    )


async def get_cached_full_book_summary(db: AsyncSession, book_id: str, model_name: str) -> BookSummary | None:
    result = await db.execute(
        select(BookSummary)
        .where(
            BookSummary.book_id == book_id,
            BookSummary.provider == "gemini-pdf",
            BookSummary.model_name == model_name,
        )
        .order_by(BookSummary.updated_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def save_full_book_summary(db: AsyncSession, book_id: str, model_name: str, summary: str) -> None:
    cached_summary = await get_cached_full_book_summary(db, book_id, model_name)
    if cached_summary is None:
        db.add(
            BookSummary(
                book_id=book_id,
                provider="gemini-pdf",
                model_name=model_name,
                summary=summary,
            )
        )
    else:
        cached_summary.summary = summary
    await db.commit()


async def iter_text(text: str):
    yield text


async def load_graph_nodes_by_label(db: AsyncSession) -> dict[str, GraphNode]:
    result = await db.execute(select(GraphNode))
    return {node.label.lower(): node for node in result.scalars().all()}


def normalize_ai_page_range(page_from: int | None, page_to: int | None) -> tuple[int | None, int | None]:
    if page_from is None and page_to is None:
        return 1, DEFAULT_AI_PAGE_WINDOW
    if page_from is not None and page_to is None:
        return page_from, page_from + DEFAULT_AI_PAGE_WINDOW - 1
    return page_from, page_to


async def get_or_create_graph_node(
    label: str,
    note: Note,
    node_by_label: dict[str, GraphNode],
    db: AsyncSession,
) -> GraphNode:
    normalized_label = label.strip()
    key = normalized_label.lower()
    node = node_by_label.get(key)

    if node is None:
        index = len(node_by_label)
        node = GraphNode(
            label=normalized_label,
            book_id=note.book_id,
            note_id=note.id,
            x_pos=float((index % 6) * 220),
            y_pos=float((index // 6) * 140),
        )
        db.add(node)
        node_by_label[key] = node
        return node

    if node.book_id and node.book_id != note.book_id:
        node.book_id = None
    if node.note_id is None:
        node.note_id = note.id

    return node


async def create_graph_edge_if_missing(
    source_node: GraphNode,
    target_node: GraphNode,
    relation: str,
    db: AsyncSession,
) -> bool:
    await db.flush()
    clean_relation = relation.strip() or "related to"
    result = await db.execute(
        select(GraphEdge)
        .where(
            GraphEdge.source_id == source_node.id,
            GraphEdge.target_id == target_node.id,
            GraphEdge.relation == clean_relation,
        )
        .limit(1)
    )
    if result.scalar_one_or_none() is not None:
        return False

    db.add(GraphEdge(source_id=source_node.id, target_id=target_node.id, relation=clean_relation))
    return True

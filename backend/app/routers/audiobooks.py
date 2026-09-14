from pathlib import Path
import asyncio
import re
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.book import Book
from app.schemas.audiobook import AudiobookSynthesisRequest, AudiobookSynthesisResponse
from app.services.book_files import resolve_book_file_path
from app.services.pdf_parser import PDFParseError, extract_pdf_text
from app.services.tts_service import TTSServiceUnavailable, synthesize_gemini_speech_bytes, write_pcm_as_wav

router = APIRouter()


@router.post("/synthesize", response_model=AudiobookSynthesisResponse)
async def synthesize_audiobook_page_range(
    request: AudiobookSynthesisRequest,
    db: AsyncSession = Depends(get_db),
) -> AudiobookSynthesisResponse:
    if request.page_to < request.page_from:
        raise HTTPException(status_code=400, detail="page_to must be greater than or equal to page_from.")

    result = await db.execute(select(Book).where(Book.id == request.book_id))
    book = result.scalar_one_or_none()
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found.")

    file_path = resolve_book_file_path(book.file_path)
    if file_path is None or not file_path.exists():
        raise HTTPException(status_code=404, detail="Book file not found.")

    try:
        extraction = extract_pdf_text(file_path, page_from=request.page_from, page_to=request.page_to)
    except PDFParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    text = "\n\n".join(page.text for page in extraction.pages if page.text.strip())
    if not text.strip():
        raise HTTPException(status_code=422, detail="No extractable text was found in this page range.")

    settings = get_settings()
    try:
        pcm_data = await asyncio.to_thread(
            synthesize_gemini_speech_bytes,
            text=text,
            gemini_api_key=settings.gemini_api_key if settings.has_gemini_api_key else "",
            model_name=settings.gemini_tts_model,
            voice_name=request.voice_name,
            tone=request.tone,
            speaking_style=request.speaking_style,
        )
    except TTSServiceUnavailable as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    audiobooks_dir = Path(settings.audiobooks_dir).resolve()
    safe_voice = slugify(request.voice_name)
    safe_tone = slugify(request.tone)
    filename = f"{request.book_id}_p{request.page_from}-{request.page_to}_{safe_voice}_{safe_tone}.wav"
    output_path = audiobooks_dir / filename
    write_pcm_as_wav(output_path, pcm_data)

    return AudiobookSynthesisResponse(
        book_id=request.book_id,
        page_from=request.page_from,
        page_to=request.page_to,
        voice_name=request.voice_name,
        tone=request.tone,
        filename=filename,
        url=f"/api/audiobooks/files/{quote(filename)}",
    )


@router.get("/files/{filename}")
async def get_audiobook_file(filename: str) -> FileResponse:
    audiobooks_dir = Path(get_settings().audiobooks_dir).resolve()
    file_path = (audiobooks_dir / Path(filename).name).resolve()
    if not file_path.is_relative_to(audiobooks_dir) or not file_path.is_file() or file_path.suffix.lower() != ".wav":
        raise HTTPException(status_code=404, detail="Audiobook file not found.")
    return FileResponse(file_path, media_type="audio/wav", filename=file_path.name)


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip()).strip("-").lower()
    return slug or "default"

from fastapi import APIRouter, HTTPException, Query

from app.config import get_settings
from app.schemas.search import SearchResponse, SearchResponseItem
from app.services.vector_store import VectorStoreError, search_book_text


router = APIRouter()


@router.get("", response_model=SearchResponse)
async def semantic_search(
    book_id: str = Query(..., min_length=1),
    query: str = Query(..., min_length=1),
    limit: int = Query(default=5, ge=1, le=20),
) -> SearchResponse:
    settings = get_settings()
    if not settings.has_openrouter_api_key and not settings.has_gemini_api_key:
        raise HTTPException(status_code=422, detail="OPENROUTER_API_KEY or GEMINI_API_KEY is required to search indexed book text.")

    try:
        matches = search_book_text(
            book_id=book_id,
            query=query,
            persist_dir=settings.chroma_persist_dir,
            gemini_api_key=settings.gemini_api_key if settings.has_gemini_api_key else "",
            openrouter_api_key=settings.openrouter_api_key if settings.has_openrouter_api_key else "",
            limit=limit,
            embedding_model_name=settings.gemini_embedding_model,
            openrouter_embedding_model_name=settings.openrouter_embedding_model,
            openrouter_app_name=settings.openrouter_app_name,
        )
    except VectorStoreError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return SearchResponse(
        book_id=book_id,
        query=query,
        results=[
            SearchResponseItem(
                text=match.text,
                score=match.score,
                book_id=match.book_id,
                page_number=match.page_number,
                chunk_index=match.chunk_index,
            )
            for match in matches
        ],
    )

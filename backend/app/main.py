from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import ai, audiobooks, books, graph, media, notes, quiz, search, tracker

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    await init_db()
    yield


app = FastAPI(title="Gemany Reading App API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "app": "Gemany Reading App API"}


app.include_router(books.router, prefix="/api/books", tags=["books"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(audiobooks.router, prefix="/api/audiobooks", tags=["audiobooks"])
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
app.include_router(tracker.router, prefix="/api/tracker", tags=["tracker"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(graph.router, prefix="/api/graph", tags=["graph"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
app.include_router(media.router, prefix="/api/media", tags=["media"])

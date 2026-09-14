from dataclasses import dataclass
from functools import lru_cache
import json
from pathlib import Path
import time
from typing import Protocol
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import chromadb
from langchain_google_genai._common import GoogleGenerativeAIError
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.services.pdf_parser import PDFTextExtraction

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
EMBEDDING_BATCH_SIZE = 32
EMBEDDING_MODEL = "models/gemini-embedding-001"
OPENROUTER_EMBEDDING_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2:free"
OPENROUTER_EMBEDDINGS_URL = "https://openrouter.ai/api/v1/embeddings"
OPENROUTER_MAX_RETRIES = 3


@dataclass(frozen=True)
class TextChunk:
    id: str
    text: str
    page_number: int
    chunk_index: int


@dataclass(frozen=True)
class IndexResult:
    book_id: str
    collection_name: str
    chunk_count: int
    page_count: int


@dataclass(frozen=True)
class SearchMatch:
    text: str
    score: float | None
    book_id: str
    page_number: int
    chunk_index: int


class VectorStoreError(Exception):
    pass


class EmbeddingProvider(Protocol):
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        pass

    def embed_query(self, text: str) -> list[float]:
        pass


class OpenRouterEmbeddings:
    def __init__(
        self,
        api_key: str,
        model_name: str = OPENROUTER_EMBEDDING_MODEL,
        app_name: str = "Gemany Reading App",
    ) -> None:
        self.api_key = api_key
        self.model_name = model_name
        self.app_name = app_name

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._embed(texts)

    def embed_query(self, text: str) -> list[float]:
        embeddings = self._embed([text])
        if not embeddings:
            raise VectorStoreError("OpenRouter returned no search embedding.")
        return embeddings[0]

    def _embed(self, texts: list[str]) -> list[list[float]]:
        clean_texts = [text.strip() for text in texts]
        if not clean_texts or any(not text for text in clean_texts):
            raise VectorStoreError("Cannot create embeddings for empty text.")

        payload = json.dumps({"model": self.model_name, "input": clean_texts}).encode("utf-8")
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": self.app_name,
        }

        last_error: Exception | None = None
        for attempt in range(OPENROUTER_MAX_RETRIES):
            request = Request(OPENROUTER_EMBEDDINGS_URL, data=payload, headers=headers, method="POST")
            try:
                with urlopen(request, timeout=60) as response:
                    response_payload = json.loads(response.read().decode("utf-8"))
                return parse_openrouter_embeddings(response_payload, len(clean_texts))
            except HTTPError as exc:
                last_error = exc
                if exc.code == 429 and attempt < OPENROUTER_MAX_RETRIES - 1:
                    time.sleep(2**attempt * 5)
                    continue
                raise VectorStoreError(f"OpenRouter embedding request failed with HTTP {exc.code}: {read_http_error(exc)}") from exc
            except (URLError, TimeoutError) as exc:
                last_error = exc
                if attempt < OPENROUTER_MAX_RETRIES - 1:
                    time.sleep(2**attempt * 3)
                    continue
            except json.JSONDecodeError as exc:
                raise VectorStoreError("OpenRouter returned an invalid embeddings response.") from exc

        raise VectorStoreError(f"Unable to create OpenRouter embeddings: {last_error}") from last_error


def collection_name_for_book(book_id: str) -> str:
    return f"books_{book_id}"


def chunk_pdf_text(
    book_id: str,
    extraction: PDFTextExtraction,
    chunk_size: int = CHUNK_SIZE,
    chunk_overlap: int = CHUNK_OVERLAP,
) -> list[TextChunk]:
    if chunk_size < 1:
        raise VectorStoreError("Chunk size must be greater than 0.")
    if chunk_overlap < 0:
        raise VectorStoreError("Chunk overlap cannot be negative.")
    if chunk_overlap >= chunk_size:
        raise VectorStoreError("Chunk overlap must be smaller than chunk size.")

    chunks: list[TextChunk] = []

    for page in extraction.pages:
        words = page.text.split()
        if not words:
            continue

        step = chunk_size - chunk_overlap
        start = 0
        page_chunk_index = 0

        while start < len(words):
            chunk_words = words[start : start + chunk_size]
            chunk_text = " ".join(chunk_words).strip()

            if chunk_text:
                chunks.append(
                    TextChunk(
                        id=f"{book_id}:p{page.page_number}:c{page_chunk_index}",
                        text=chunk_text,
                        page_number=page.page_number,
                        chunk_index=len(chunks),
                    )
                )

            page_chunk_index += 1
            start += step

    return chunks


def index_book_text(
    book_id: str,
    extraction: PDFTextExtraction,
    persist_dir: str,
    gemini_api_key: str,
    openrouter_api_key: str = "",
    embedding_model_name: str = EMBEDDING_MODEL,
    openrouter_embedding_model_name: str = OPENROUTER_EMBEDDING_MODEL,
    openrouter_app_name: str = "Gemany Reading App",
    embedding_model: EmbeddingProvider | None = None,
) -> IndexResult:
    if not gemini_api_key and not openrouter_api_key and embedding_model is None:
        raise VectorStoreError("OPENROUTER_API_KEY or GEMINI_API_KEY is required to index book text.")

    chunks = chunk_pdf_text(book_id, extraction)
    if not chunks:
        raise VectorStoreError("No extractable text was found in this PDF.")

    collection_name = collection_name_for_book(book_id)
    client = get_chroma_client(persist_dir)

    try:
        client.delete_collection(collection_name)
    except Exception:
        pass

    collection = client.create_collection(name=collection_name, metadata={"book_id": book_id})
    model = embedding_model or get_embedding_model(
        gemini_api_key=gemini_api_key,
        gemini_model_name=embedding_model_name,
        openrouter_api_key=openrouter_api_key,
        openrouter_model_name=openrouter_embedding_model_name,
        openrouter_app_name=openrouter_app_name,
    )

    try:
        for chunk_batch in chunked(chunks, EMBEDDING_BATCH_SIZE):
            embeddings = model.embed_documents([chunk.text for chunk in chunk_batch])
            if len(embeddings) != len(chunk_batch):
                raise VectorStoreError("The embedding provider returned an unexpected number of embeddings.")

            collection.add(
                ids=[chunk.id for chunk in chunk_batch],
                documents=[chunk.text for chunk in chunk_batch],
                embeddings=embeddings,
                metadatas=[
                    {
                        "book_id": book_id,
                        "page_number": chunk.page_number,
                        "chunk_index": chunk.chunk_index,
                    }
                    for chunk in chunk_batch
                ],
            )
    except GoogleGenerativeAIError as exc:
        raise VectorStoreError(f"Unable to create Gemini embeddings: {exc}") from exc
    except VectorStoreError:
        raise
    except Exception as exc:
        raise VectorStoreError("Unable to create embeddings for this book.") from exc

    return IndexResult(
        book_id=book_id,
        collection_name=collection_name,
        chunk_count=len(chunks),
        page_count=extraction.page_count,
    )


def search_book_text(
    book_id: str,
    query: str,
    persist_dir: str,
    gemini_api_key: str,
    openrouter_api_key: str = "",
    limit: int = 5,
    embedding_model_name: str = EMBEDDING_MODEL,
    openrouter_embedding_model_name: str = OPENROUTER_EMBEDDING_MODEL,
    openrouter_app_name: str = "Gemany Reading App",
    embedding_model: EmbeddingProvider | None = None,
) -> list[SearchMatch]:
    if not gemini_api_key and not openrouter_api_key and embedding_model is None:
        raise VectorStoreError("OPENROUTER_API_KEY or GEMINI_API_KEY is required to search indexed book text.")

    clean_query = query.strip()
    if not clean_query:
        raise VectorStoreError("Search query cannot be empty.")

    collection_name = collection_name_for_book(book_id)
    client = get_chroma_client(persist_dir)

    try:
        collection = client.get_collection(name=collection_name)
    except Exception as exc:
        raise VectorStoreError("Book text has not been indexed yet.") from exc

    try:
        query_embedding = (
            embedding_model
            or get_embedding_model(
                gemini_api_key=gemini_api_key,
                gemini_model_name=embedding_model_name,
                openrouter_api_key=openrouter_api_key,
                openrouter_model_name=openrouter_embedding_model_name,
                openrouter_app_name=openrouter_app_name,
            )
        ).embed_query(clean_query)
        result = collection.query(query_embeddings=[query_embedding], n_results=limit)
    except GoogleGenerativeAIError as exc:
        raise VectorStoreError(f"Unable to create Gemini search embedding: {exc}") from exc
    except Exception as exc:
        raise VectorStoreError("Unable to search this book index.") from exc

    documents = result.get("documents", [[]])[0]
    metadatas = result.get("metadatas", [[]])[0]
    distances = result.get("distances", [[]])[0]
    matches: list[SearchMatch] = []

    for index, document in enumerate(documents):
        metadata = metadatas[index] if index < len(metadatas) and metadatas[index] else {}
        distance = distances[index] if index < len(distances) else None
        matches.append(
            SearchMatch(
                text=document,
                score=distance_to_score(distance),
                book_id=str(metadata.get("book_id", book_id)),
                page_number=int(metadata.get("page_number", 0)),
                chunk_index=int(metadata.get("chunk_index", 0)),
            )
        )

    return matches


def delete_book_collection(book_id: str, persist_dir: str) -> None:
    client = get_chroma_client(persist_dir)
    try:
        client.delete_collection(collection_name_for_book(book_id))
    except Exception:
        pass


def chunked[T](items: list[T], batch_size: int) -> list[list[T]]:
    if batch_size < 1:
        raise VectorStoreError("Batch size must be greater than 0.")
    return [items[index : index + batch_size] for index in range(0, len(items), batch_size)]


@lru_cache(maxsize=4)
def get_chroma_client(persist_dir: str) -> chromadb.PersistentClient:
    Path(persist_dir).mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(path=persist_dir)


@lru_cache(maxsize=8)
def get_embedding_model(
    gemini_api_key: str,
    gemini_model_name: str = EMBEDDING_MODEL,
    openrouter_api_key: str = "",
    openrouter_model_name: str = OPENROUTER_EMBEDDING_MODEL,
    openrouter_app_name: str = "Gemany Reading App",
) -> EmbeddingProvider:
    if openrouter_api_key:
        return OpenRouterEmbeddings(
            api_key=openrouter_api_key,
            model_name=openrouter_model_name,
            app_name=openrouter_app_name,
        )
    return GoogleGenerativeAIEmbeddings(model=gemini_model_name, google_api_key=gemini_api_key)


def distance_to_score(distance: float | None) -> float | None:
    if distance is None:
        return None
    return 1 / (1 + distance)


def parse_openrouter_embeddings(payload: object, expected_count: int) -> list[list[float]]:
    if not isinstance(payload, dict):
        raise VectorStoreError("OpenRouter embeddings response was not an object.")

    data = payload.get("data")
    if not isinstance(data, list):
        raise VectorStoreError("OpenRouter embeddings response did not include data.")

    embeddings: list[list[float]] = []
    for item in data:
        if not isinstance(item, dict):
            raise VectorStoreError("OpenRouter embeddings response included an invalid item.")
        embedding = item.get("embedding")
        if not isinstance(embedding, list):
            raise VectorStoreError("OpenRouter embeddings response included an item without an embedding.")
        embeddings.append([float(value) for value in embedding])

    if len(embeddings) != expected_count:
        raise VectorStoreError("OpenRouter returned an unexpected number of embeddings.")

    return embeddings


def read_http_error(exc: HTTPError) -> str:
    try:
        raw_body = exc.read().decode("utf-8", errors="replace")
    except Exception:
        return str(exc.reason)

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        return raw_body[:500]

    if isinstance(payload, dict):
        error = payload.get("error")
        if isinstance(error, dict) and error.get("message"):
            return str(error["message"])
        if payload.get("message"):
            return str(payload["message"])

    return raw_body[:500]

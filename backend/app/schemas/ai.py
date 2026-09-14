from pydantic import BaseModel, Field


class SummarizeRequest(BaseModel):
    book_id: str = Field(..., min_length=1)
    page_from: int | None = Field(default=None, ge=1)
    page_to: int | None = Field(default=None, ge=1)
    max_context_chars: int = Field(default=24000, ge=1000, le=120000)


class FullBookSummaryRequest(BaseModel):
    book_id: str = Field(..., min_length=1)
    pages_per_chunk: int = Field(default=10, ge=2, le=40)
    max_chunk_chars: int = Field(default=45000, ge=5000, le=120000)
    max_parallel_requests: int = Field(default=5, ge=1, le=10)


class ChatRequest(BaseModel):
    book_id: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1, max_length=4000)
    limit: int = Field(default=6, ge=1, le=12)


class ChatSource(BaseModel):
    page_number: int
    chunk_index: int
    score: float | None
    text: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]


class EntityExtractionRequest(BaseModel):
    note_id: str = Field(..., min_length=1)


class EntityExtractionResponse(BaseModel):
    entities: list[str]
    relations: list[tuple[str, str, str]]
    node_count: int
    edge_count: int

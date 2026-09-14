from pydantic import BaseModel, Field


class SearchResponseItem(BaseModel):
    text: str
    score: float | None
    book_id: str
    page_number: int
    chunk_index: int


class SearchResponse(BaseModel):
    book_id: str
    query: str
    results: list[SearchResponseItem] = Field(default_factory=list)

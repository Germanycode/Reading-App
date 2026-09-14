from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BookBase(BaseModel):
    title: str
    author: str | None = None
    category: str | None = None


class BookCreate(BookBase):
    file_path: str
    file_size: int | None = None
    page_count: int | None = None


class BookUpdate(BaseModel):
    title: str


class BookRead(BookBase):
    id: str
    file_path: str
    file_size: int | None
    page_count: int | None
    cover_url: str | None
    is_indexed: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BookSyncResult(BaseModel):
    scanned: int
    created: int
    updated: int
    skipped: int
    books: list[BookRead]


class BookPageText(BaseModel):
    page_number: int
    text: str
    char_count: int
    word_count: int


class BookTextExtraction(BaseModel):
    book_id: str
    title: str
    author: str | None
    page_count: int
    page_from: int
    page_to: int
    total_char_count: int
    total_word_count: int
    pages: list[BookPageText]


class BookIndexResult(BaseModel):
    book_id: str
    collection_name: str
    chunk_count: int
    page_count: int
    is_indexed: bool

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NoteCreate(BaseModel):
    book_id: str
    page_number: int | None = None
    content: str
    highlight: str | None = None
    color: str = "yellow"


class NoteUpdate(BaseModel):
    content: str
    highlight: str | None = None
    color: str = "yellow"


class NoteRead(NoteCreate):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

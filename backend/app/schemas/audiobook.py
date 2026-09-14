from pydantic import BaseModel, Field


class AudiobookSynthesisRequest(BaseModel):
    book_id: str = Field(..., min_length=1)
    page_from: int = Field(..., ge=1)
    page_to: int = Field(..., ge=1)
    voice_name: str = Field(default="Charon", min_length=1, max_length=64)
    tone: str = Field(default="calm", min_length=1, max_length=64)
    speaking_style: str | None = Field(default=None, max_length=240)


class AudiobookSynthesisResponse(BaseModel):
    book_id: str
    page_from: int
    page_to: int
    voice_name: str
    tone: str
    filename: str
    url: str

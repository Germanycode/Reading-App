from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class QuizRequest(BaseModel):
    book_id: str = Field(..., min_length=1)
    num_questions: int = Field(default=5, ge=1, le=20)
    page_from: int | None = Field(default=None, ge=1)
    page_to: int | None = Field(default=None, ge=1)
    max_context_chars: int = Field(default=24000, ge=1000, le=120000)
    difficulty: str = Field(default="medium")


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    answer: int
    explanation: str

    @field_validator("options")
    @classmethod
    def validate_options(cls, options: list[str]) -> list[str]:
        if len(options) != 4:
            raise ValueError("Quiz questions must include exactly 4 options.")
        return options

    @field_validator("answer")
    @classmethod
    def validate_answer(cls, answer: int) -> int:
        if answer < 0 or answer > 3:
            raise ValueError("Quiz answer must be an option index from 0 to 3.")
        return answer


class QuizItemRead(QuizQuestion):
    id: str
    book_id: str
    difficulty: str | None = None
    next_review: datetime | None = None
    ease_factor: float = 2.5
    created_at: datetime


class QuizReviewUpdate(BaseModel):
    quality: int = Field(ge=0, le=5)

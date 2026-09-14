import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.time import utc_now


class QuizItem(Base):
    __tablename__ = "quiz_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    book_id: Mapped[str] = mapped_column(ForeignKey("books.id"), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[int] = mapped_column(Integer, nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str | None] = mapped_column(String, nullable=True)
    next_review: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

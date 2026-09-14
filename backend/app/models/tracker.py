import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.time import utc_now


class ReadingSession(Base):
    __tablename__ = "reading_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    book_id: Mapped[str] = mapped_column(ForeignKey("books.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    pages_read: Mapped[int] = mapped_column(Integer, default=0)
    last_page: Mapped[int] = mapped_column(Integer, default=0)
    minutes_spent: Mapped[int] = mapped_column(Integer, default=0)
    quiz_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

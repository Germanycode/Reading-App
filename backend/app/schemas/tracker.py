from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class StreakRead(BaseModel):
    current_streak: int = 0
    longest_streak: int = 0
    last_read_date: date | None = None
    total_days: int = 0


class ReadingPositionRead(BaseModel):
    book_id: str
    last_page: int = 1


class ReadingPositionUpdate(BaseModel):
    last_page: int = Field(ge=1)


class ReadingSessionRead(BaseModel):
    id: str
    book_id: str
    date: date
    pages_read: int = 0
    last_page: int = 0
    minutes_spent: int = 0
    quiz_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReadingSessionStart(BaseModel):
    current_page: int = Field(default=1, ge=1)


class ReadingSessionStop(BaseModel):
    started_page: int = Field(default=1, ge=1)
    last_page: int = Field(default=1, ge=1)
    elapsed_seconds: int = Field(ge=0, le=24 * 60 * 60)


class ReadingActivityDay(BaseModel):
    date: date
    pages_read: int = 0
    minutes_spent: int = 0
    session_count: int = 0


class ReadingStatsRead(BaseModel):
    total_pages_read: int = 0
    total_minutes_spent: int = 0
    total_sessions: int = 0
    active_days: int = 0
    average_pages_per_day: float = 0
    average_minutes_per_day: float = 0
    best_day: ReadingActivityDay | None = None


class BookProgressRead(BaseModel):
    book_id: str
    last_page: int = 0
    page_count: int | None = None
    progress_percent: int = 0

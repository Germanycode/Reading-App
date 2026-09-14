from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.book import Book
from app.models.tracker import ReadingSession
from app.schemas.tracker import (
    BookProgressRead,
    ReadingActivityDay,
    ReadingPositionRead,
    ReadingPositionUpdate,
    ReadingSessionRead,
    ReadingSessionStart,
    ReadingSessionStop,
    ReadingStatsRead,
    StreakRead,
)
from app.time import utc_now

router = APIRouter()


@router.get("/streak", response_model=StreakRead)
async def get_streak(db: AsyncSession = Depends(get_db)) -> StreakRead:
    sessions = await get_all_sessions(db)
    active_dates = get_active_dates(sessions)
    return calculate_streak(active_dates)


@router.get("/activity", response_model=list[ReadingActivityDay])
async def get_activity(days: int = 98, db: AsyncSession = Depends(get_db)) -> list[ReadingActivityDay]:
    bounded_days = min(max(days, 1), 366)
    start_date = date.today() - timedelta(days=bounded_days - 1)
    result = await db.execute(
        select(ReadingSession)
        .where(ReadingSession.date >= start_date)
        .order_by(ReadingSession.date.asc())
    )
    sessions = list(result.scalars().all())
    activity_by_date = aggregate_activity_by_date(sessions)

    return [
        activity_by_date.get(
            start_date + timedelta(days=offset),
            ReadingActivityDay(date=start_date + timedelta(days=offset)),
        )
        for offset in range(bounded_days)
    ]


@router.get("/stats", response_model=ReadingStatsRead)
async def get_stats(db: AsyncSession = Depends(get_db)) -> ReadingStatsRead:
    sessions = await get_all_sessions(db)
    activity_days = [day for day in aggregate_activity_by_date(sessions).values() if is_activity_day(day)]
    total_pages = sum(day.pages_read for day in activity_days)
    total_minutes = sum(day.minutes_spent for day in activity_days)
    total_sessions = sum(day.session_count for day in activity_days)
    active_days = len(activity_days)
    best_day = max(
        activity_days,
        key=lambda day: (day.minutes_spent, day.pages_read, day.date),
        default=None,
    )

    return ReadingStatsRead(
        total_pages_read=total_pages,
        total_minutes_spent=total_minutes,
        total_sessions=total_sessions,
        active_days=active_days,
        average_pages_per_day=round(total_pages / active_days, 1) if active_days else 0,
        average_minutes_per_day=round(total_minutes / active_days, 1) if active_days else 0,
        best_day=best_day,
    )


@router.get("/books/progress", response_model=list[BookProgressRead])
async def get_book_progress(db: AsyncSession = Depends(get_db)) -> list[BookProgressRead]:
    books_result = await db.execute(select(Book))
    books = list(books_result.scalars().all())
    sessions = await get_all_sessions(db)
    latest_by_book: dict[str, ReadingSession] = {}

    for session in sessions:
        latest_session = latest_by_book.get(session.book_id)
        if latest_session is None or session.updated_at > latest_session.updated_at:
            latest_by_book[session.book_id] = session

    progress: list[BookProgressRead] = []
    for book in books:
        session = latest_by_book.get(book.id)
        last_page = session.last_page if session else 0
        progress_percent = (
            min(100, max(0, round((last_page / book.page_count) * 100)))
            if book.page_count
            else 0
        )
        progress.append(
            BookProgressRead(
                book_id=book.id,
                last_page=last_page,
                page_count=book.page_count,
                progress_percent=progress_percent,
            )
        )

    return progress


@router.get("/books/{book_id}/position", response_model=ReadingPositionRead)
async def get_reading_position(book_id: str, db: AsyncSession = Depends(get_db)) -> ReadingPositionRead:
    await ensure_book_exists(book_id, db)

    result = await db.execute(
        select(ReadingSession)
        .where(ReadingSession.book_id == book_id)
        .order_by(ReadingSession.updated_at.desc())
        .limit(1)
    )
    session = result.scalar_one_or_none()

    return ReadingPositionRead(book_id=book_id, last_page=session.last_page if session else 1)


@router.put("/books/{book_id}/position", response_model=ReadingPositionRead)
async def update_reading_position(
    book_id: str,
    position: ReadingPositionUpdate,
    db: AsyncSession = Depends(get_db),
) -> ReadingPositionRead:
    await ensure_book_exists(book_id, db)

    today = date.today()
    result = await db.execute(
        select(ReadingSession)
        .where(ReadingSession.book_id == book_id, ReadingSession.date == today)
        .limit(1)
    )
    session = result.scalar_one_or_none()

    if session is None:
        session = ReadingSession(book_id=book_id, date=today, last_page=position.last_page)
        db.add(session)
    else:
        previous_page = session.last_page
        session.last_page = position.last_page
        session.pages_read = max(session.pages_read, max(0, position.last_page - previous_page))
        session.updated_at = utc_now()

    await db.commit()
    await db.refresh(session)

    return ReadingPositionRead(book_id=book_id, last_page=session.last_page)


@router.post("/books/{book_id}/sessions/start", response_model=ReadingSessionRead)
async def start_reading_session(
    book_id: str,
    session_start: ReadingSessionStart,
    db: AsyncSession = Depends(get_db),
) -> ReadingSession:
    await ensure_book_exists(book_id, db)
    session = await get_or_create_today_session(book_id, session_start.current_page, db)
    await db.commit()
    await db.refresh(session)
    return session


@router.post("/books/{book_id}/sessions/stop", response_model=ReadingSessionRead)
async def stop_reading_session(
    book_id: str,
    session_stop: ReadingSessionStop,
    db: AsyncSession = Depends(get_db),
) -> ReadingSession:
    await ensure_book_exists(book_id, db)
    session = await get_or_create_today_session(book_id, session_stop.started_page, db)

    elapsed_minutes = max(1, round(session_stop.elapsed_seconds / 60)) if session_stop.elapsed_seconds > 0 else 0
    pages_advanced = max(0, session_stop.last_page - session_stop.started_page)

    session.last_page = session_stop.last_page
    session.pages_read += pages_advanced
    session.minutes_spent += elapsed_minutes
    session.updated_at = utc_now()

    await db.commit()
    await db.refresh(session)
    return session


async def ensure_book_exists(book_id: str, db: AsyncSession) -> None:
    result = await db.execute(select(Book.id).where(Book.id == book_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Book not found.")


async def get_or_create_today_session(book_id: str, current_page: int, db: AsyncSession) -> ReadingSession:
    today = date.today()
    result = await db.execute(
        select(ReadingSession)
        .where(ReadingSession.book_id == book_id, ReadingSession.date == today)
        .limit(1)
    )
    session = result.scalar_one_or_none()

    if session is None:
        session = ReadingSession(book_id=book_id, date=today, last_page=current_page)
        db.add(session)
    else:
        session.last_page = max(session.last_page, current_page)
        session.updated_at = utc_now()

    return session


async def get_all_sessions(db: AsyncSession) -> list[ReadingSession]:
    result = await db.execute(select(ReadingSession).order_by(ReadingSession.date.asc()))
    return list(result.scalars().all())


def is_active_session(session: ReadingSession) -> bool:
    return session.minutes_spent > 0 or session.pages_read > 0


def get_active_dates(sessions: list[ReadingSession]) -> list[date]:
    return sorted({session.date for session in sessions if is_active_session(session)})


def calculate_streak(active_dates: list[date]) -> StreakRead:
    if not active_dates:
        return StreakRead()

    active_date_set = set(active_dates)
    today = date.today()
    last_read_date = active_dates[-1]
    current_streak = 0

    if last_read_date in {today, today - timedelta(days=1)}:
        cursor = last_read_date
        while cursor in active_date_set:
            current_streak += 1
            cursor -= timedelta(days=1)

    longest_streak = 0
    running_streak = 0
    previous_date: date | None = None

    for active_date in active_dates:
        if previous_date is not None and active_date == previous_date + timedelta(days=1):
            running_streak += 1
        else:
            running_streak = 1
        longest_streak = max(longest_streak, running_streak)
        previous_date = active_date

    return StreakRead(
        current_streak=current_streak,
        longest_streak=longest_streak,
        last_read_date=last_read_date,
        total_days=len(active_dates),
    )


def aggregate_activity_by_date(sessions: list[ReadingSession]) -> dict[date, ReadingActivityDay]:
    activity_by_date: dict[date, ReadingActivityDay] = {}

    for session in sessions:
        activity = activity_by_date.setdefault(session.date, ReadingActivityDay(date=session.date))
        activity.pages_read += session.pages_read
        activity.minutes_spent += session.minutes_spent
        if is_active_session(session):
            activity.session_count += 1

    return activity_by_date


def is_activity_day(day: ReadingActivityDay) -> bool:
    return day.minutes_spent > 0 or day.pages_read > 0

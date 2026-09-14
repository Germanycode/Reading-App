import json
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.quiz import QuizItem
from app.schemas.quiz import QuizItemRead, QuizReviewUpdate
from app.time import utc_now

router = APIRouter()


@router.get("/{book_id}/due", response_model=list[QuizItemRead])
async def list_due_quiz_items(
    book_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[QuizItemRead]:
    now = utc_now()
    result = await db.execute(
        select(QuizItem)
        .where(
            QuizItem.book_id == book_id,
            or_(QuizItem.next_review.is_(None), QuizItem.next_review <= now),
        )
        .order_by(QuizItem.next_review.asc().nullsfirst(), QuizItem.created_at.asc())
        .limit(limit)
    )
    return [serialize_quiz_item(item) for item in result.scalars().all()]


@router.post("/{quiz_item_id}/review", response_model=QuizItemRead)
async def review_quiz_item(
    quiz_item_id: str,
    review: QuizReviewUpdate,
    db: AsyncSession = Depends(get_db),
) -> QuizItemRead:
    result = await db.execute(select(QuizItem).where(QuizItem.id == quiz_item_id))
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=404, detail="Quiz item not found.")

    item.ease_factor = calculate_ease_factor(item.ease_factor, review.quality)
    item.next_review = utc_now() + timedelta(days=calculate_interval_days(item.ease_factor, review.quality))
    await db.commit()
    await db.refresh(item)
    return serialize_quiz_item(item)


def serialize_quiz_item(item: QuizItem) -> QuizItemRead:
    try:
        options = json.loads(item.options)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=422, detail="Stored quiz options are invalid.") from exc

    return QuizItemRead(
        id=item.id,
        book_id=item.book_id,
        question=item.question,
        options=options,
        answer=item.answer,
        explanation=item.explanation or "",
        difficulty=item.difficulty,
        next_review=item.next_review,
        ease_factor=item.ease_factor,
        created_at=item.created_at,
    )


def calculate_ease_factor(current_ease: float, quality: int) -> float:
    if quality < 3:
        return max(1.3, current_ease - 0.2)

    adjustment = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    return max(1.3, current_ease + adjustment)


def calculate_interval_days(ease_factor: float, quality: int) -> int:
    if quality < 3:
        return 1
    if quality == 3:
        return 2
    if quality == 4:
        return max(3, round(ease_factor * 2))
    return max(5, round(ease_factor * 4))

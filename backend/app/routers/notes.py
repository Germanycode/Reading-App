from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.book import Book
from app.models.graph import GraphEdge, GraphNode
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteRead, NoteUpdate

router = APIRouter()


@router.get("", response_model=list[NoteRead])
async def list_notes(book_id: str | None = Query(default=None), db: AsyncSession = Depends(get_db)) -> list[Note]:
    statement = select(Note).order_by(Note.created_at.desc())
    if book_id:
        statement = statement.where(Note.book_id == book_id)

    result = await db.execute(statement)
    return list(result.scalars().all())


@router.get("/export")
async def export_notes_markdown(book_id: str | None = Query(default=None), db: AsyncSession = Depends(get_db)) -> Response:
    statement = select(Note).order_by(Note.created_at.asc())
    if book_id:
        statement = statement.where(Note.book_id == book_id)

    result = await db.execute(statement)
    notes = list(result.scalars().all())
    markdown = build_notes_markdown(notes)

    return Response(
        content=markdown,
        media_type="text/markdown",
        headers={"Content-Disposition": 'attachment; filename="reading-notes.md"'},
    )


@router.post("", response_model=NoteRead)
async def create_note(note: NoteCreate, db: AsyncSession = Depends(get_db)) -> Note:
    result = await db.execute(select(Book.id).where(Book.id == note.book_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Book not found.")

    db_note = Note(**note.model_dump())
    db.add(db_note)
    await db.commit()
    await db.refresh(db_note)
    return db_note


@router.put("/{note_id}", response_model=NoteRead)
async def update_note(note_id: str, note_update: NoteUpdate, db: AsyncSession = Depends(get_db)) -> Note:
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()

    if note is None:
        raise HTTPException(status_code=404, detail="Note not found.")

    clean_content = note_update.content.strip()
    clean_highlight = note_update.highlight.strip() if note_update.highlight else None
    if not clean_content and not clean_highlight:
        raise HTTPException(status_code=422, detail="Note content or highlight is required.")

    note.content = clean_content or clean_highlight or ""
    note.highlight = clean_highlight
    note.color = note_update.color

    await db.commit()
    await db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=204)
async def delete_note(note_id: str, db: AsyncSession = Depends(get_db)) -> None:
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()

    if note is None:
        raise HTTPException(status_code=404, detail="Note not found.")

    graph_node_ids = await db.execute(select(GraphNode.id).where(GraphNode.note_id == note_id))
    node_ids = list(graph_node_ids.scalars().all())
    if node_ids:
        await db.execute(delete(GraphEdge).where(GraphEdge.source_id.in_(node_ids) | GraphEdge.target_id.in_(node_ids)))
        await db.execute(delete(GraphNode).where(GraphNode.id.in_(node_ids)))

    await db.delete(note)
    await db.commit()


def build_notes_markdown(notes: list[Note]) -> str:
    lines = ["# Reading Notes", ""]
    if not notes:
        lines.append("No notes yet.")
        return "\n".join(lines)

    for note in notes:
        page_label = f"page {note.page_number}" if note.page_number else "unknown page"
        lines.extend(
            [
                f"## {page_label}",
                "",
                f"- Book ID: `{note.book_id}`",
                f"- Created: {note.created_at.isoformat()}",
                "",
            ]
        )
        if note.highlight:
            lines.extend(["> " + note.highlight.replace("\n", "\n> "), ""])
        lines.extend([note.content, ""])

    return "\n".join(lines).strip() + "\n"

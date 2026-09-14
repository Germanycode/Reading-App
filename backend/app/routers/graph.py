from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.book import Book
from app.models.graph import GraphEdge, GraphNode
from app.models.note import Note
from app.schemas.graph import GraphNodePositionUpdate, GraphNodeRead, KnowledgeGraphRead

router = APIRouter()


@router.get("", response_model=KnowledgeGraphRead)
async def get_knowledge_graph(db: AsyncSession = Depends(get_db)) -> KnowledgeGraphRead:
    nodes_result = await db.execute(select(GraphNode).order_by(GraphNode.created_at.asc()))
    edges_result = await db.execute(select(GraphEdge).order_by(GraphEdge.created_at.asc()))
    notes_result = await db.execute(select(Note))
    books_result = await db.execute(select(Book))
    notes_by_id = {note.id: note for note in notes_result.scalars().all()}
    books_by_id = {book.id: book for book in books_result.scalars().all()}

    return KnowledgeGraphRead(
        nodes=[
            build_graph_node_read(node, notes_by_id, books_by_id)
            for node in nodes_result.scalars().all()
        ],
        edges=list(edges_result.scalars().all()),
    )


@router.put("/nodes/{node_id}/position", response_model=GraphNodeRead)
async def update_node_position(
    node_id: str,
    position: GraphNodePositionUpdate,
    db: AsyncSession = Depends(get_db),
) -> GraphNode:
    result = await db.execute(select(GraphNode).where(GraphNode.id == node_id))
    node = result.scalar_one_or_none()

    if node is None:
        raise HTTPException(status_code=404, detail="Graph node not found.")

    node.x_pos = position.x_pos
    node.y_pos = position.y_pos
    await db.commit()
    await db.refresh(node)
    return node


def build_graph_node_read(
    node: GraphNode,
    notes_by_id: dict[str, Note],
    books_by_id: dict[str, Book],
) -> GraphNodeRead:
    note = notes_by_id.get(node.note_id or "")
    book_id = node.book_id or note.book_id if note else node.book_id
    book = books_by_id.get(book_id or "")

    return GraphNodeRead(
        id=node.id,
        label=node.label,
        book_id=book_id,
        note_id=node.note_id,
        book_title=book.title if book else None,
        page_number=note.page_number if note else None,
        note_content=note.content if note else None,
        note_highlight=note.highlight if note else None,
        x_pos=node.x_pos,
        y_pos=node.y_pos,
        created_at=node.created_at,
    )

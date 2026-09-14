from datetime import datetime

from pydantic import BaseModel, ConfigDict


class GraphNodeRead(BaseModel):
    id: str
    label: str
    book_id: str | None = None
    note_id: str | None = None
    book_title: str | None = None
    page_number: int | None = None
    note_content: str | None = None
    note_highlight: str | None = None
    x_pos: float | None = None
    y_pos: float | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GraphEdgeRead(BaseModel):
    id: str
    source_id: str
    target_id: str
    relation: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class KnowledgeGraphRead(BaseModel):
    nodes: list[GraphNodeRead]
    edges: list[GraphEdgeRead]


class GraphNodePositionUpdate(BaseModel):
    x_pos: float
    y_pos: float

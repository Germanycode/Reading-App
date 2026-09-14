import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.time import utc_now


class GraphNode(Base):
    __tablename__ = "graph_nodes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    label: Mapped[str] = mapped_column(String, nullable=False)
    book_id: Mapped[str | None] = mapped_column(String, nullable=True)
    note_id: Mapped[str | None] = mapped_column(String, nullable=True)
    x_pos: Mapped[float | None] = mapped_column(Float, nullable=True)
    y_pos: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class GraphEdge(Base):
    __tablename__ = "graph_edges"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id: Mapped[str] = mapped_column(ForeignKey("graph_nodes.id"), nullable=False)
    target_id: Mapped[str] = mapped_column(ForeignKey("graph_nodes.id"), nullable=False)
    relation: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

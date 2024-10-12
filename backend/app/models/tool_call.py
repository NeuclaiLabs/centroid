from datetime import datetime

import nanoid
from sqlalchemy import DateTime, func
from sqlmodel import JSON, Field, Relationship, SQLModel

from .user import User


class ToolCallBase(SQLModel):
    chat_id: str
    kind: str
    result: dict | None = None
    status: str
    payload: dict | None = None


class ToolCallCreate(ToolCallBase):
    chat_id: str
    kind: str
    # queued, in_progress, requires_action, cancelling, cancelled, failed, completed, incomplete, or expired.
    status: str | None = "in_progress"
    payload: dict | None = None


class ToolCallUpdate(ToolCallBase):
    chat_id: str | None = None
    parent_id: str | None = None
    kind: str | None = None
    steps: dict | None = None
    result: dict | None = None
    status: str | None = None
    updated_at: datetime = datetime.utcnow()


class ToolCall(ToolCallBase, table=True):
    __tablename__ = "tool_calls"
    id: str = Field(default_factory=nanoid.generate, primary_key=True)
    result: dict | None = Field(
        default=None, sa_type=JSON, sa_column_kwargs={"nullable": True}
    )
    payload: dict | None = Field(default=None, sa_type=JSON)

    owner_id: str | None = Field(
        default=None, foreign_key="users.id", nullable=False, alias="ownerId"
    )
    owner: User | None = Relationship(back_populates="tool_calls")
    created_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now()},
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": func.now(), "server_default": func.now()},
    )


class ToolCallOut(ToolCallBase):
    id: str | None
    created_at: datetime | None
    updated_at: datetime | None
    result: dict


class ToolCallsOut(SQLModel):
    data: list[ToolCallOut]
    count: int

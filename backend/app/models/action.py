from datetime import datetime

import nanoid
from sqlalchemy import DateTime, func
from sqlmodel import JSON, Field, Relationship, SQLModel

from .user import User


class ActionBase(SQLModel):
    chat_id: str
    parent_id: str | None = None
    type: str
    steps: dict | None = None
    result: dict | None = None
    status: str


class ActionCreate(ActionBase):
    chat_id: str
    parent_id: str | None = None
    type: str
    steps: dict | None = None
    result: dict | None = None
    status: str


class ActionUpdate(ActionBase):
    chat_id: str | None = None
    parent_id: str | None = None
    type: str | None = None
    steps: dict | None = None
    result: dict | None = None
    status: str | None = None
    updated_at: datetime = datetime.utcnow()


class Action(ActionBase, table=True):
    id: str = Field(default_factory=nanoid.generate, primary_key=True)
    result: dict | None = Field(
        default=None, sa_type=JSON, sa_column_kwargs={"nullable": True}
    )
    steps: dict | None = Field(default=None, sa_type=JSON)

    owner_id: str | None = Field(
        default=None, foreign_key="user.id", nullable=False, alias="ownerId"
    )
    owner: User | None = Relationship(back_populates="actions")
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


class ActionOut(ActionBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime


class ActionsOut(SQLModel):
    data: list[ActionOut]
    count: int

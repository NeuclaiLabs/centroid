from datetime import datetime

import nanoid
from sqlalchemy import DateTime, func
from sqlmodel import JSON, Field, Relationship, SQLModel  # Shared properties

from .user import User


class ConnectionBase(SQLModel):
    name: str
    data: dict
    type: str


class ConnectionCreate(ConnectionBase):
    name: str
    data: dict
    type: str


class ConnectionUpdate(ConnectionBase):
    name: str | None = None
    data: dict | None = None
    type: str | None = None
    updated_at: datetime = datetime.utcnow()


class Connection(ConnectionBase, table=True):
    id: str = Field(default_factory=nanoid.generate, primary_key=True)
    data: dict = Field(default=None, sa_type=JSON)

    created_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={
            "server_default": func.now(),
        },
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": func.now(), "server_default": func.now()},
    )
    owner_id: str | None = Field(
        default=None, foreign_key="user.id", nullable=False, alias="ownerId"
    )
    owner: User | None = Relationship(back_populates="connections")


class ConnectionOut(ConnectionBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime


class ConnectionsOut(SQLModel):
    data: list[ConnectionOut]
    count: int

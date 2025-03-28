from datetime import datetime

import nanoid
from sqlalchemy import Column, DateTime, func
from sqlmodel import JSON, Field, SQLModel


class ConnectionBase(SQLModel):
    name: str
    description: str | None = None
    kind: str
    base_url: str
    auth: dict | None = Field(default=None, sa_column=Column(JSON))


class ConnectionCreate(ConnectionBase):
    pass


class ConnectionUpdate(SQLModel):
    name: str | None = None
    description: str | None = None
    kind: str | None = None
    base_url: str | None = None
    auth: dict | None = None


class Connection(ConnectionBase, SQLModel, table=True):
    __tablename__ = "connections"
    id: str = Field(default_factory=nanoid.generate, primary_key=True)

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


class ConnectionOut(ConnectionBase):
    id: str
    created_at: datetime
    updated_at: datetime


class ConnectionsOut(SQLModel):
    data: list[ConnectionOut]
    count: int

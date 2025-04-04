from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING

import nanoid
from sqlalchemy import DateTime, func
from sqlmodel import Field, Relationship, SQLModel

from .base import CamelModel

if TYPE_CHECKING:
    from .connection import Connection
    from .tool_definition import ToolDefinition
    from .user import User


class ToolInstanceStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class ToolInstanceSearch(CamelModel):
    app_id: str | None = None


class ToolInstanceBase(CamelModel):
    definition_id: str = Field(foreign_key="tool_definitions.id")
    connection_id: str | None = Field(default=None, foreign_key="connections.id")
    status: ToolInstanceStatus = Field(default=ToolInstanceStatus.ACTIVE)
    owner_id: str = Field(foreign_key="users.id")
    app_id: str = Field(foreign_key="apps.id")


class ToolInstanceCreate(ToolInstanceBase):
    pass


class ToolInstanceUpdate(CamelModel):
    definition_id: str | None = None
    connection_id: str | None = None
    status: ToolInstanceStatus | None = None
    app_id: str | None = None


class ToolInstance(ToolInstanceBase, SQLModel, table=True):
    __tablename__ = "tool_instances"
    id: str | None = Field(default_factory=nanoid.generate, primary_key=True)
    app_id: str = Field(nullable=False)
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
    definition: ToolDefinition = Relationship(
        back_populates="tool_instances",
        sa_relationship_kwargs={"lazy": "selectin"},
    )
    connection: Connection = Relationship(
        back_populates="tool_instances",
        sa_relationship_kwargs={"lazy": "selectin"},
    )
    owner: User = Relationship(
        back_populates="tool_instances",
        sa_relationship_kwargs={"lazy": "selectin"},
    )


class ToolInstanceOut(ToolInstanceBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime


class ToolInstancesOut(CamelModel):
    data: list[ToolInstanceOut]
    count: int

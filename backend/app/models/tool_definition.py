from datetime import datetime
from typing import Any

import nanoid
from sqlalchemy import JSON, Column, DateTime, func
from sqlmodel import Field, Relationship, SQLModel

from .base import CamelModel


class ToolDefinitionBase(CamelModel):
    id: str | None
    app_id: str
    tool_schema: dict[str, Any] | None = Field(
        default=None, sa_column=Column("schema", JSON)
    )
    tool_metadata: dict[str, Any] | None = Field(
        default=None, sa_column=Column("metadata", JSON)
    )


class ToolDefinitionCreate(ToolDefinitionBase):
    pass


class ToolDefinitionUpdate(CamelModel):
    app_id: str | None = None
    tool_schema: dict[str, Any] | None = None
    tool_metadata: dict[str, Any] | None = None


class ToolDefinition(ToolDefinitionBase, SQLModel, table=True):
    __tablename__ = "tool_definitions"
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
    tool_instances: list["ToolInstance"] = Relationship(
        back_populates="definition",
    )


class ToolDefinitionSearch(CamelModel):
    app_id: str | None = None


class ToolDefinitionOut(CamelModel):
    id: str
    app_id: str
    tool_schema: dict[str, Any] | None = None
    tool_metadata: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime


class ToolDefinitionsOut(CamelModel):
    data: list[ToolDefinitionOut]
    count: int


# Import at the end to avoid circular imports
from .tool_instance import ToolInstance  # noqa

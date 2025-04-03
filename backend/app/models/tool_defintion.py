from datetime import datetime
from typing import TYPE_CHECKING

import nanoid
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .tool_instance import ToolInstance


class ToolDefinitionBase(SQLModel):
    app_id: str
    tool_schema: dict = Field(default={}, alias="schema")
    tool_metadata: dict = Field(default={}, alias="metadata")


class ToolDefinitionCreate(ToolDefinitionBase):
    pass


class ToolDefinitionUpdate(SQLModel):
    app_id: str | None = None
    tool_schema: dict | None = Field(default=None, alias="schema")
    tool_metadata: dict | None = Field(default=None, alias="metadata")


class ToolDefinition(ToolDefinitionBase, table=True):
    __tablename__ = "tool_definitions"
    id: str | None = Field(default_factory=nanoid.generate, primary_key=True)
    app_id: str = Field(nullable=False)
    tool_schema: dict | None = Field(default=None, sa_column_kwargs={"name": "schema"})
    tool_metadata: dict | None = Field(
        default=None, sa_column_kwargs={"name": "metadata"}
    )
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    tool_instances: list["ToolInstance"] = Relationship(back_populates="definition")


class ToolDefinitionOut(ToolDefinitionBase):
    id: str
    created_at: datetime
    updated_at: datetime


class ToolDefinitionsOut(SQLModel):
    data: list[ToolDefinitionOut]
    count: int

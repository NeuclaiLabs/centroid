from datetime import datetime

import nanoid
from sqlmodel import Field, Relationship, SQLModel

from .tool_defintion import ToolDefinition


class ToolInstanceBase(SQLModel):
    definition_id: str
    status: str = "active"  # Can be 'active', 'inactive', 'deprecated', etc.


class ToolInstanceCreate(ToolInstanceBase):
    pass


class ToolInstanceUpdate(SQLModel):
    definition_id: str | None = None
    status: str | None = None


class ToolInstance(ToolInstanceBase, table=True):
    __tablename__ = "tool_instances"
    id: str | None = Field(default=nanoid.generate, primary_key=True)
    definition_id: str = Field(foreign_key="tool_definitions.id")
    definition: ToolDefinition = Relationship(back_populates="tool_instances")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class ToolInstanceOut(ToolInstanceBase):
    id: str
    created_at: datetime
    updated_at: datetime


class ToolInstancesOut(SQLModel):
    data: list[ToolInstanceOut]
    count: int

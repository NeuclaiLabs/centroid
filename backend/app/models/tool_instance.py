import enum
from datetime import datetime
from typing import TYPE_CHECKING, Any, Optional

import nanoid
from sqlalchemy import JSON, DateTime, event, func
from sqlmodel import Column, Field, Relationship, SQLModel

from .base import CamelModel

if TYPE_CHECKING:
    from .mcp_instance import MCPInstance
    from .user import User


class ToolInstanceStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class ToolInstanceSearch(CamelModel):
    pass


class ToolInstanceBase(CamelModel):
    status: ToolInstanceStatus = Field(default=ToolInstanceStatus.ACTIVE)
    owner_id: str = Field(foreign_key="users.id")
    mcp_instance_id: str | None = Field(default=None, foreign_key="mcp_instances.id")
    config: dict[str, Any] | None = Field(default=None, sa_type=JSON)
    tool_schema: dict[str, Any] | None = Field(
        default=None, sa_column=Column("schema", JSON)
    )
    tool_metadata: dict[str, Any] | None = Field(
        default=None, sa_column=Column("metadata", JSON)
    )


class ToolInstanceCreate(ToolInstanceBase):
    pass


class ToolInstanceUpdate(CamelModel):
    status: ToolInstanceStatus | None = None
    mcp_instance_id: str | None = None
    config: dict[str, Any] | None = None


class ToolInstance(ToolInstanceBase, SQLModel, table=True):
    __tablename__ = "tool_instances"
    id: str | None = Field(default_factory=nanoid.generate, primary_key=True)
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
    mcp_instance_id: str | None = Field(default=None, foreign_key="mcp_instances.id")
    owner: "User" = Relationship(back_populates="tool_instances")
    mcp_instance: Optional["MCPInstance"] = Relationship(
        back_populates="tool_instances"
    )


@event.listens_for(ToolInstance, "before_update")
def handle_status_change(mapper, connection, target: ToolInstance) -> None:  # noqa: ARG001
    """Handle tool registration/deregistration when status changes."""
    from app.mcp.mcp_manager import MCPManager

    history = target._sa_instance_state.attrs.status.history
    if history.has_changes():
        old_status = history.deleted[0] if history.deleted else None

        # Get the MCP manager instance
        mcp_manager = MCPManager.get_instance()

        # Get the MCP server from the registry
        mcp_server = mcp_manager.get_mcp_server(target.mcp_instance_id)
        if not mcp_server:
            return

        # Handle the status change
        mcp_server.handle_status_change(target, old_status)


class ToolInstanceOut(ToolInstanceBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime


class ToolInstancesOut(CamelModel):
    data: list[ToolInstanceOut]
    count: int

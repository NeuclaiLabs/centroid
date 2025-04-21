import enum
from datetime import datetime
from typing import Any

import nanoid
from sqlalchemy import JSON, DateTime, event, func
from sqlmodel import Field, Relationship, SQLModel

from .base import CamelModel
from .connection import Connection
from .tool_instance import ToolInstance
from .user import User


class MCPInstanceStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class MCPInstanceSearch(CamelModel):
    pass


class MCPInstanceBase(CamelModel):
    name: str | None = None
    description: str | None = None
    status: MCPInstanceStatus = Field(default=MCPInstanceStatus.ACTIVE)
    connection_id: str | None = Field(default=None, foreign_key="connections.id")
    url: str = Field(default="http://localhost:8000")
    config: dict[str, Any] | None = Field(default=None, sa_type=JSON)
    owner_id: str | None = Field(default=None, foreign_key="users.id")


class MCPInstanceCreate(MCPInstanceBase):
    pass


class MCPInstanceUpdate(CamelModel):
    name: str | None = None
    description: str | None = None
    status: MCPInstanceStatus | None = None
    connection_id: str | None = None
    url: str | None = None
    config: dict[str, Any] | None = None


class MCPInstance(MCPInstanceBase, SQLModel, table=True):
    __tablename__ = "mcp_instances"
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
    owner: User = Relationship(back_populates="mcp_instances")
    connection: Connection | None = Relationship(back_populates="mcp_instances")
    tool_instances: list[ToolInstance] | None = Relationship(
        back_populates="mcp_instance"
    )

    @property
    def mount_path(self) -> str:
        """Compute the mount path based on the instance ID."""
        return f"/mcp/{self.id}"


# Event listeners for MCP instance lifecycle management
@event.listens_for(MCPInstance, "after_insert")
def handle_instance_creation(mapper, connection, target: MCPInstance) -> None:  # noqa: ARG001
    """Handle MCP instance creation."""
    import asyncio

    # Lazy import to avoid circular dependency
    from app.mcp.mcp_manager import MCPManager

    async def register_and_create_tools():
        manager = MCPManager.get_instance()
        await manager._register_instance(target)
        # Get the MCP server and create tools
        mcp_server = manager.get_mcp_server(target.id)
        if mcp_server:
            mcp_server.create_tools()

    asyncio.create_task(register_and_create_tools())


@event.listens_for(MCPInstance, "after_update")
def handle_instance_update(mapper, connection, target: MCPInstance) -> None:  # noqa: ARG001
    """Handle MCP instance update."""
    import asyncio

    # Lazy import to avoid circular dependency
    from app.mcp.mcp_manager import MCPManager

    manager = MCPManager.get_instance()
    # Check if status changed to inactive
    if target.status == MCPInstanceStatus.INACTIVE:
        asyncio.create_task(manager._deregister_instance(target.id))
    # Check if status changed to active
    elif target.status == MCPInstanceStatus.ACTIVE:
        asyncio.create_task(manager._register_instance(target))


@event.listens_for(MCPInstance, "after_delete")
def handle_instance_deletion(mapper, connection, target: MCPInstance) -> None:  # noqa: ARG001
    """Handle MCP instance deletion."""
    import asyncio

    # Lazy import to avoid circular dependency
    from app.mcp.mcp_manager import MCPManager

    if target.id in MCPManager.get_instance()._registry:
        asyncio.create_task(MCPManager.get_instance()._deregister_instance(target.id))


class MCPInstanceOut(MCPInstanceBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    mount_path: str


class MCPInstancesOut(CamelModel):
    data: list[MCPInstanceOut]
    count: int

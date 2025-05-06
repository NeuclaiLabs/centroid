"""Main MCPServer model with lifecycle methods."""

import asyncio
from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, String, event, func, inspect
from sqlmodel import Field, Relationship, SQLModel

from app.core.logger import get_logger
from app.core.security import decrypt_dict, encrypt_dict

from ..user import User
from ..utils import generate_docker_style_name
from .base import (
    MCPServerBase,
    MCPServerStatus,
)

logger = get_logger(__name__, service="mcp_server")


class MCPServer(MCPServerBase, SQLModel, table=True):
    """Model for MCP servers."""

    __tablename__ = "mcp_servers"

    id: str = Field(
        default_factory=generate_docker_style_name,
        primary_key=True,
        description="Unique identifier for the MCP server",
    )
    created_at: datetime = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={
            "server_default": func.now(),
        },
        description="Timestamp when the MCP server was created",
    )
    updated_at: datetime = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": func.now(), "server_default": func.now()},
        description="Timestamp when the MCP server was last updated",
    )
    owner: User = Relationship(back_populates="mcp_servers")
    # tools: list[MCPTool] | None = Field(default=None, sa_type=JSON)
    encrypted_secrets: str | None = Field(
        default=None,
        sa_column=Column("encrypted_secrets", String),
        description="Encrypted secrets for the MCP server",
    )

    def __init__(self, **data):
        secrets = data.pop("secrets", None)
        super().__init__(**data)
        if secrets is not None:
            self.secrets = secrets

    @property
    def secrets(self) -> dict[str, Any] | None:
        """Decrypt and return the secrets."""
        if not self.encrypted_secrets:
            return None
        try:
            return decrypt_dict(self.encrypted_secrets)
        except Exception as e:
            logger.error(f"Error decrypting secrets: {e}")
            return None

    @secrets.setter
    def secrets(self, value: dict[str, Any] | None) -> None:
        """Encrypt and store the secrets."""
        if value is None:
            self.encrypted_secrets = None
            return

        if not isinstance(value, dict):
            raise ValueError("Secrets must be a dictionary")

        self.encrypted_secrets = encrypt_dict(value)

    def model_dump(self, *args, **kwargs) -> dict[str, Any]:
        """Override model_dump to include secrets in the output if requested."""
        exclude = kwargs.pop("exclude", set())
        data = super().model_dump(
            *args, exclude=exclude | {"encrypted_secrets"}, **kwargs
        )

        if "secrets" not in exclude:
            try:
                secrets = self.secrets
                data["secrets"] = secrets
            except Exception as e:
                logger.error(f"Error including secrets in model_dump: {e}")
                data["secrets"] = None

        # Get the proxy from MCPManager to ensure we have the most up-to-date instance
        from app.mcp.manager import MCPManager

        proxy = MCPManager.get_singleton().get_mcp_proxy(self.id)

        # Include proxy state if available
        if proxy:
            data["state"] = proxy.state
            data["last_ping_time"] = proxy.last_ping_time
            data["connection_errors"] = proxy.connection_errors
            data["stats"] = proxy.stats

        return data

    @property
    def mount_path(self) -> str:
        """Compute the mount path based on the instance ID."""
        return f"/mcp/{self.id}"

    @property
    def messages_path(self) -> str:
        """Compute the messages path based on the mount path."""
        return f"{self.mount_path}/messages/"


# Event listeners for MCP server lifecycle management
@event.listens_for(MCPServer, "after_insert")
def handle_instance_creation(mapper, connection, target: MCPServer) -> None:  # noqa: ARG001
    """Handle MCP server creation."""

    # Lazy import to avoid circular dependency
    from app.mcp.manager import MCPManager

    asyncio.create_task(MCPManager.get_singleton().start_server(target))


@event.listens_for(MCPServer, "after_update")
def handle_instance_update(mapper, connection, target: MCPServer) -> None:  # noqa: ARG001
    """Handle MCP server update."""

    # Lazy import to avoid circular dependency
    from app.mcp.manager import MCPManager

    # Get the state and history of the status attribute
    state = inspect(target)
    history = state.attrs.status.history

    # If status hasn't changed, return early
    if not history.has_changes():
        return

    manager = MCPManager.get_singleton()
    # Check if status changed to inactive from active
    if (
        target.status == MCPServerStatus.INACTIVE
        and MCPServerStatus.ACTIVE in history.deleted
    ):
        asyncio.create_task(manager.stop_server(target))
    # Check if status changed to active from inactive
    elif (
        target.status == MCPServerStatus.ACTIVE
        and MCPServerStatus.INACTIVE in history.deleted
    ):
        asyncio.create_task(manager.start_server(target))


@event.listens_for(MCPServer, "after_delete")
def handle_instance_deletion(mapper, connection, target: MCPServer) -> None:  # noqa: ARG001
    """Handle MCP server deletion."""

    # Lazy import to avoid circular dependency
    from app.mcp.manager import MCPManager

    asyncio.create_task(MCPManager.get_singleton().stop_server(target))

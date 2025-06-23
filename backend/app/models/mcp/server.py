"""Main MCPServer model with lifecycle methods."""

import enum
from datetime import datetime
from typing import Any, Literal

from sqlalchemy import JSON, Column, DateTime, String, func
from sqlmodel import Field, Relationship, Session, SQLModel

from app.core.logger import get_logger
from app.core.security import decrypt_dict, encrypt_dict

from ..base import CamelModel
from ..secret import Secret
from ..user import User
from ..utils import generate_docker_style_name
from .template import MCPRunConfig, MCPTemplate, MCPTemplateKind, MCPTool

logger = get_logger(__name__, service="mcp_server")


class SecretReference(CamelModel):
    """Reference to a stored secret."""

    type: Literal["reference"] = "reference"
    secret_id: str = Field(description="ID of the referenced secret")


class SecretValue(CamelModel):
    """Direct secret value."""

    type: Literal["value"] = "value"
    value: str = Field(description="Direct secret value")


SecretInput = SecretReference | SecretValue


def resolve_secrets(
    secrets: dict[str, SecretInput] | None, session: "Session", user_id: str
) -> dict[str, Any] | None:
    """Resolve secret references to actual values."""
    if not secrets:
        return None

    resolved = {}
    for key, secret_input in secrets.items():
        if secret_input.type == "value":
            # Direct value
            resolved[key] = secret_input.value
        elif secret_input.type == "reference":
            # Reference to stored secret
            db_secret = session.get(Secret, secret_input.secret_id)
            if not db_secret:
                logger.error(f"Secret with ID {secret_input.secret_id} not found")
                raise ValueError(f"Secret with ID {secret_input.secret_id} not found")

            if db_secret.owner_id != user_id:
                logger.error(
                    f"User {user_id} does not have access to secret {secret_input.secret_id}"
                )
                raise ValueError(f"Access denied to secret {secret_input.secret_id}")

            # Get the decrypted value
            secret_value = db_secret.value
            if secret_value is None:
                logger.error(f"Secret {secret_input.secret_id} has no value")
                raise ValueError(f"Secret {secret_input.secret_id} has no value")
            resolved[key] = secret_value
            logger.info(
                f"Resolved secret reference {secret_input.secret_id} for key {key}"
            )

    return resolved


class MCPServerStatus(str, enum.Enum):
    """Status of an MCP server."""

    ACTIVE = "active"
    INACTIVE = "inactive"


class MCPServerSearch(CamelModel):
    """Model for MCP server search parameters."""

    pass


class MCPServerState(str, enum.Enum):
    """State of an MCP server."""

    PENDING = "pending"
    INITIALIZING = "initializing"
    RUNNING = "running"
    STOPPING = "stopping"
    STOPPED = "stopped"
    RESTARTING = "restarting"
    DISCONNECTED = "disconnected"
    ERROR = "error"


class MCPServerBase(CamelModel):
    """Base model for MCP servers."""

    name: str = Field(index=True, description="Name of the MCP server")
    description: str = Field(description="Description of the MCP server")
    status: MCPServerStatus = Field(
        default=MCPServerStatus.ACTIVE,
        description="Status of the MCP server",
        index=True,
    )
    kind: MCPTemplateKind = Field(
        default=MCPTemplateKind.OFFICIAL, description="Kind of MCP server", index=True
    )
    transport: str = Field(description="Transport type for the MCP server")
    version: str = Field(description="Version of the MCP server")
    template_id: str | None = Field(
        default=None,
        description="ID of the template used to create the MCP server",
        foreign_key="mcp_templates.id",
        ondelete="CASCADE",
        index=True,
    )
    run: MCPRunConfig | None = Field(
        default=None,
        description="Run configuration for the MCP server",
        sa_column=Column(JSON),
    )
    settings: dict[str, Any] | None = Field(
        default=None, description="Settings for the MCP server", sa_column=Column(JSON)
    )
    owner_id: str | None = Field(
        default=None,
        description="ID of the owner of the MCP server",
        foreign_key="users.id",
        ondelete="CASCADE",
        index=True,
    )
    tools: list["MCPTool"] | None = Field(
        default=None,
        description="Tools used to create the MCP server",
        sa_column=Column(JSON),
    )
    state: MCPServerState | None = Field(
        default=None,
        description="State of the MCP server",
        index=True,
    )
    instructions: str | None = Field(
        default=None, description="Instructions for the MCP server"
    )


class MCPServerCreate(MCPServerBase):
    """Model for creating an MCP server."""

    # Override run without sa_column for creation
    run: MCPRunConfig | None = Field(
        default=None,
        description="Run configuration for the MCP server",
    )
    # Override settings without sa_column for creation
    settings: dict[str, Any] | None = Field(
        default=None, description="Settings for the MCP server"
    )
    # Add fields specific to creation - supports both direct values and secret references
    secrets: dict[str, SecretInput] | None = None
    instructions: str | None = Field(
        default=None, description="Instructions for the MCP server"
    )


class MCPServerUpdate(CamelModel):
    """Model for updating an MCP server."""

    name: str | None = None
    description: str | None = None
    status: MCPServerStatus | None = None
    kind: MCPTemplateKind | None = None
    transport: str | None = None
    version: str | None = None
    url: str | None = None
    run: MCPRunConfig | None = None
    settings: dict[str, Any] | None = None
    secrets: dict[str, SecretInput] | None = None
    tools: list[MCPTool] | None = None
    instructions: str | None = None


class MCPServerOut(MCPServerBase):
    """Model for MCP server output."""

    id: str
    mount_path: str
    created_at: datetime
    updated_at: datetime
    owner_id: str
    state: MCPServerState | None = None
    last_ping_time: datetime | None = None
    connection_errors: dict[str, Any] | None = None
    stats: dict[str, Any] | None = None
    secrets: dict[str, Any] | None = None
    template: MCPTemplate | None = None
    instructions: str | None


class MCPServersOut(CamelModel):
    """Model for MCP servers output."""

    data: list[MCPServerOut]
    count: int


class MCPServerOutWithTemplate(CamelModel):
    """Model for MCP server output with template."""

    id: str
    template_id: str


class MCPServersOutWithTemplate(CamelModel):
    """Model for MCP servers output with template."""

    data: list[MCPServerOutWithTemplate]
    count: int


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
    template: MCPTemplate = Relationship(back_populates="servers")
    # tools: list[MCPTool] | None = Field(default=None, sa_type=JSON)
    encrypted_secrets: str | None = Field(
        default=None,
        sa_column=Column("encrypted_secrets", String),
        description="Encrypted secrets for the MCP server",
    )
    instructions: str | None = Field(
        default=None,
        sa_type=String,
        description="Instructions for the MCP server",
    )

    def __init__(self, **data):
        secrets = data.pop("secrets", None)
        super().__init__(**data)
        if secrets is not None:
            logger.info(
                f"Initializing MCP server with provided secrets, server_id={data.get('id', 'new_server')}"
            )
            self.secrets = secrets
        else:
            logger.info(
                f"Initializing MCP server without secrets, server_id={data.get('id', 'new_server')}"
            )

    @property
    def secrets(self) -> dict[str, Any] | None:
        """Decrypt and return the secrets."""
        if not self.encrypted_secrets:
            logger.debug(f"No encrypted secrets to decrypt for server {self.id}")
            return None
        try:
            logger.debug(f"Decrypting secrets for server {self.id}")
            decrypted = decrypt_dict(self.encrypted_secrets)
            logger.debug(f"Successfully decrypted secrets for server {self.id}")
            return decrypted
        except Exception as e:
            logger.critical(f"Error decrypting secrets for server {self.id}: {e}")
            return None

    @secrets.setter
    def secrets(self, value: dict[str, Any] | None) -> None:
        """Encrypt and store the secrets."""
        if value is None:
            logger.info(f"Clearing secrets for server {self.id}")
            self.encrypted_secrets = None
            return

        if not isinstance(value, dict):
            error_msg = (
                f"Secrets must be a dictionary, got {type(value)} for server {self.id}"
            )
            logger.critical(error_msg)
            raise ValueError(error_msg)

        try:
            logger.info(
                f"Encrypting secrets for server {self.id} with {len(value)} key(s)"
            )
            self.encrypted_secrets = encrypt_dict(value)
            logger.info(f"Successfully encrypted secrets for server {self.id}")
        except Exception as e:
            logger.critical(f"Failed to encrypt secrets for server {self.id}: {e}")
            raise

    def model_dump(self, *args, **kwargs) -> dict[str, Any]:
        """Override model_dump to include secrets and mount_path in the output if requested."""
        exclude = kwargs.pop("exclude", set())
        data = super().model_dump(
            *args, exclude=exclude | {"encrypted_secrets"}, **kwargs
        )

        # Include secrets if not excluded
        try:
            logger.debug(f"Including secrets in model_dump for server {self.id}")
            secrets = self.secrets
            data["secrets"] = secrets
        except Exception as e:
            logger.critical(
                f"Error including secrets in model_dump for server {self.id}: {e}"
            )
            data["secrets"] = None

        data["mount_path"] = self.mount_path

        # Get the proxy from MCPManager to ensure we have the most up-to-date instance
        from app.mcp.manager import MCPManager

        try:
            logger.debug(f"Getting MCP proxy for server {self.id} from MCPManager")
            proxy = MCPManager.get_singleton().get_mcp_proxy(self.id)

            # Include proxy state if available
            if proxy:
                logger.debug(
                    f"Including proxy state in model_dump for server {self.id}"
                )
                data["last_ping_time"] = proxy.last_ping_time
                data["connection_errors"] = proxy.connection_errors
                data["stats"] = proxy.stats
            else:
                logger.warning(f"No proxy found for server {self.id} in MCPManager")
        except Exception as e:
            logger.critical(f"Error getting proxy data for server {self.id}: {e}")

        return data

    @property
    def mount_path(self) -> str:
        """Get the mount path for this server."""
        path = f"/mcp/{self.id}"
        logger.debug(f"Generated mount path {path} for server {self.id}")
        return path

    @property
    def messages_path(self) -> str:
        """Compute the messages path based on the mount path."""
        path = f"{self.mount_path}/messages/"
        logger.debug(f"Generated messages path {path} for server {self.id}")
        return path

    @property
    def last_ping_time(self) -> datetime | None:
        """Get the last ping time from the proxy."""
        try:
            from app.mcp.manager import MCPManager

            proxy = MCPManager.get_singleton().get_mcp_proxy(self.id)
            return proxy.last_ping_time if proxy else None
        except Exception as e:
            logger.error(f"Error getting last_ping_time for server {self.id}: {e}")
            return None

    @property
    def connection_errors(self) -> dict[str, Any] | None:
        """Get connection errors from the proxy."""
        try:
            from app.mcp.manager import MCPManager

            proxy = MCPManager.get_singleton().get_mcp_proxy(self.id)
            return proxy.connection_errors if proxy else None
        except Exception as e:
            logger.error(f"Error getting connection_errors for server {self.id}: {e}")
            return None

    @property
    def stats(self) -> dict[str, Any] | None:
        """Get stats from the proxy."""
        try:
            from app.mcp.manager import MCPManager

            proxy = MCPManager.get_singleton().get_mcp_proxy(self.id)
            return proxy.stats if proxy else None
        except Exception as e:
            logger.error(f"Error getting stats for server {self.id}: {e}")
            return None

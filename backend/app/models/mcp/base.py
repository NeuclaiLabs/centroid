"""Base models and utilities for MCP servers."""

import enum
import random
from datetime import datetime
from typing import Any, Literal

from sqlalchemy import JSON, Column
from sqlmodel import Field

from ..base import CamelModel
from ..utils import ADJECTIVES, NAMES


def generate_docker_style_name() -> str:
    """Generate a Docker-style name combining an adjective, a name, and random digits."""
    adjective = random.choice(ADJECTIVES)
    name = random.choice(NAMES)
    # Generate a random 4-digit number
    random_digits = str(random.randint(1000, 9999))
    return f"{adjective}_{name}_{random_digits}"


class MCPTool(CamelModel):
    """Model for MCP tool."""

    name: str = Field(description="Name of the tool")
    description: str = Field(description="Description of the tool")
    parameters: dict[str, Any] = Field(description="Parameters of the tool")
    status: bool = Field(description="Status of the tool")


class MCPServerStatus(str, enum.Enum):
    """Status of an MCP server."""

    ACTIVE = "active"
    INACTIVE = "inactive"


class MCPServerKind(str, enum.Enum):
    """Kind of MCP server."""

    OFFICIAL = "official"
    EXTERNAL = "external"
    OPENAPI = "openapi"


class MCPServerRunConfig(CamelModel):
    """Model for MCP server run configuration."""

    command: str = Field(description="Command to run")
    args: list[str] | None = Field(
        default=None, description="Arguments for the command"
    )
    env: dict[str, str] | None = Field(
        default=None, description="Environment variables"
    )
    cwd: str | None = Field(default=None, description="Working directory")


class MCPServerSearch(CamelModel):
    """Model for MCP server search parameters."""

    pass


class MCPServerConnectionStats(CamelModel):
    """Model for MCP server connection statistics."""

    requests: int = Field(default=0, description="Number of requests processed")
    errors: int = Field(default=0, description="Number of errors encountered")
    last_response_time: float | None = Field(
        default=None, description="Last response time in seconds"
    )


class MCPServerConnectionErrors(CamelModel):
    """Model for MCP server connection errors."""

    count: int = Field(default=0, description="Number of connection errors")
    last_error: str | None = Field(default=None, description="Last error message")


class MCPServerBase(CamelModel):
    """Base model for MCP servers."""

    name: str = Field(description="Name of the MCP server")
    description: str = Field(description="Description of the MCP server")
    status: MCPServerStatus = Field(
        default=MCPServerStatus.ACTIVE, description="Status of the MCP server"
    )
    kind: MCPServerKind = Field(
        default=MCPServerKind.OFFICIAL, description="Kind of MCP server"
    )
    transport: str = Field(description="Transport type for the MCP server")
    version: str = Field(description="Version of the MCP server")
    template_id: str | None = Field(
        default=None,
        description="ID of the template used to create the MCP server",
    )
    run: MCPServerRunConfig | None = Field(
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
    )
    tools: list["MCPTool"] | None = Field(
        default=None,
        description="Tools used to create the MCP server",
        sa_column=Column(JSON),
    )


class MCPServerCreate(MCPServerBase):
    """Model for creating an MCP server."""

    name: str = Field(description="Name of the MCP server")
    description: str = Field(description="Description of the MCP server")
    status: MCPServerStatus = Field(
        default=MCPServerStatus.ACTIVE, description="Status of the MCP server"
    )
    kind: MCPServerKind = Field(
        default=MCPServerKind.OFFICIAL, description="Kind of MCP server"
    )
    transport: str = Field(description="Transport type for the MCP server")
    version: str = Field(description="Version of the MCP server")
    template_id: str | None = Field(
        default=None,
        description="ID of the template used to create the MCP server",
    )
    run: MCPServerRunConfig | None = Field(
        default=None,
        description="Run configuration for the MCP server",
    )
    settings: dict[str, Any] | None = Field(
        default=None, description="Settings for the MCP server"
    )
    secrets: dict[str, Any] | None = None


class MCPServerUpdate(CamelModel):
    """Model for updating an MCP server."""

    name: str | None = None
    description: str | None = None
    status: MCPServerStatus | None = None
    kind: MCPServerKind | None = None
    transport: str | None = None
    version: str | None = None
    url: str | None = None
    run: MCPServerRunConfig | None = None
    settings: dict[str, Any] | None = None
    metadata: dict[str, Any] | None = None
    secrets: dict[str, Any] | None = None
    tools: list["MCPTool"] | None = None


class MCPServerOut(MCPServerBase):
    """Model for MCP server output."""

    id: str
    created_at: datetime
    updated_at: datetime
    mount_path: str
    secrets: dict[str, Any] | None = None
    # Proxy runtime state
    state: (
        Literal[
            "pending",
            "initializing",
            "running",
            "stopping",
            "stopped",
            "restarting",
            "terminated",
            "shutting-down",
            "disconnected",
            "error",
        ]
        | None
    ) = Field(default="disconnected", description="Current runtime state of the server")
    last_ping_time: datetime | None = Field(
        default=None, description="Last time the server was pinged"
    )
    connection_errors: MCPServerConnectionErrors | None = Field(
        default=None, description="Connection error information"
    )
    stats: MCPServerConnectionStats | None = Field(
        default=None, description="Server statistics"
    )


class MCPServerOutNoSecrets(MCPServerBase):
    """Model for MCP server output without secrets."""

    id: str
    created_at: datetime
    updated_at: datetime
    mount_path: str
    # Proxy runtime state
    state: (
        Literal[
            "pending",
            "initializing",
            "running",
            "stopping",
            "stopped",
            "restarting",
            "terminated",
            "shutting-down",
            "disconnected",
            "error",
        ]
        | None
    ) = Field(default="disconnected", description="Current runtime state of the server")
    last_ping_time: datetime | None = Field(
        default=None, description="Last time the server was pinged"
    )
    connection_errors: MCPServerConnectionErrors | None = Field(
        default=None, description="Connection error information"
    )
    stats: MCPServerConnectionStats | None = Field(
        default=None, description="Server statistics"
    )


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

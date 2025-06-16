"""Model for MCP templates."""

import enum
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Boolean, Column, DateTime, String, func
from sqlmodel import Field, Relationship, SQLModel

from app.core.logger import get_logger

from ..base import CamelModel

if TYPE_CHECKING:
    from .server import MCPServer


class MCPTool(CamelModel):
    """Model for MCP tool."""

    name: str = Field(description="Name of the tool")
    description: str = Field(description="Description of the tool")
    parameters: dict[str, Any] = Field(description="Parameters of the tool")
    status: bool = Field(description="Status of the tool")


class MCPRunConfig(CamelModel):
    """Model for MCP server run configuration."""

    command: str = Field(description="Command to run")
    args: list[str] | None = Field(
        default=None, description="Arguments for the command"
    )
    env: dict[str, str] | None = Field(
        default=None, description="Environment variables"
    )
    cwd: str | None = Field(default=None, description="Working directory")


logger = get_logger(__name__, service="mcp_template")


class MCPTemplateStatus(str, enum.Enum):
    """Status of an MCP template."""

    ACTIVE = "active"
    INACTIVE = "inactive"


class MCPTemplateKind(str, enum.Enum):
    """Kind of MCP template."""

    OFFICIAL = "official"
    EXTERNAL = "external"
    OPENAPI = "openapi"


class MCPTemplateBase(CamelModel):
    """Base model for MCP templates."""

    name: str = Field(description="Name of the MCP template")
    description: str = Field(description="Description of the MCP template")
    status: MCPTemplateStatus = Field(
        default=MCPTemplateStatus.ACTIVE, description="Status of the MCP template"
    )
    kind: MCPTemplateKind = Field(
        default=MCPTemplateKind.OFFICIAL, description="Kind of MCP template"
    )
    transport: str = Field(description="Transport type for the MCP template")
    version: str = Field(description="Version of the MCP template")
    run: MCPRunConfig | None = Field(
        default=None,
        description="Run configuration for the MCP template",
        sa_column=Column(JSON),
    )
    tools: list[MCPTool] | None = Field(
        default=None,
        description="Tools available in this template",
        sa_column=Column(JSON),
    )
    details: dict[str, Any] | None = Field(
        default=None,
        description="Additional details for the template",
        sa_column=Column(JSON),
    )
    is_agent: bool = Field(
        default=False, description="Whether this template is for an agent"
    )
    instructions: str | None = Field(
        default=None, description="Instructions for the MCP template"
    )


class MCPTemplate(MCPTemplateBase, SQLModel, table=True):
    """Model for MCP templates."""

    __tablename__ = "mcp_templates"

    id: str = Field(
        primary_key=True,
        description="Unique identifier for the MCP template",
    )
    created_at: datetime = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={
            "server_default": func.now(),
        },
        description="Timestamp when the MCP template was created",
    )
    updated_at: datetime = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": func.now(), "server_default": func.now()},
        description="Timestamp when the MCP template was last updated",
    )
    is_agent: bool = Field(
        default=False,
        sa_type=Boolean,
        description="Whether this template is for an agent",
    )
    instructions: str | None = Field(
        default=None,
        sa_type=String,
        description="Instructions for the MCP template",
    )
    servers: list["MCPServer"] = Relationship(back_populates="template")


class MCPTemplateCreate(MCPTemplateBase):
    """Model for creating an MCP template."""

    id: str = Field(description="Unique identifier for the MCP template")


class MCPTemplateUpdate(CamelModel):
    """Model for updating an MCP template."""

    name: str | None = None
    description: str | None = None
    status: MCPTemplateStatus | None = None
    kind: MCPTemplateKind | None = None
    transport: str | None = None
    version: str | None = None
    run: MCPRunConfig | None = None
    tools: list[MCPTool] | None = None
    details: dict[str, Any] | None = None
    is_agent: bool | None = None
    instructions: str | None = None


class MCPTemplateOut(MCPTemplateBase):
    """Model for MCP template output."""

    id: str
    is_agent: bool
    instructions: str | None
    servers: list["MCPServer"] | None = Field(default=None)


class MCPTemplatesOut(CamelModel):
    """Model for MCP templates output."""

    data: list[MCPTemplateOut]
    count: int

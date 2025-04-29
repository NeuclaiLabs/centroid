import enum
from datetime import datetime
from typing import Any

import nanoid
from sqlalchemy import JSON, DateTime, func
from sqlmodel import Field, SQLModel

from .base import CamelModel


class MCPTemplateStatus(str, enum.Enum):
    """Status of an MCP template."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    DEPRECATED = "deprecated"


class MCPTemplateKind(str, enum.Enum):
    """Kind of MCP template."""

    OFFICIAL = "official"
    EXTERNAL = "external"
    OPENAPI = "openapi"


class MCPToolParameter(CamelModel):
    """Model for MCP tool parameter."""

    type: str = Field(description="Type of the parameter")
    properties: dict[str, Any] = Field(description="Properties of the parameter")


class MCPTool(CamelModel):
    """Model for MCP tool."""

    name: str = Field(description="Name of the tool")
    description: str = Field(description="Description of the tool")
    parameters: MCPToolParameter = Field(description="Parameters of the tool")
    status: bool = Field(description="Status of the tool")


class MCPRunConfig(CamelModel):
    """Model for MCP run configuration."""

    command: str = Field(description="Command to run")
    args: list[str] = Field(
        default_factory=list, description="Arguments for the command"
    )
    env: dict[str, str] = Field(
        default_factory=dict, description="Environment variables"
    )
    cwd: str = Field(description="Working directory")
    timeout: int = Field(description="Timeout in seconds")
    max_retries: int = Field(description="Maximum number of retries")
    retry_delay: int = Field(description="Delay between retries in seconds")


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
    run: MCPRunConfig = Field(description="Run configuration for the MCP template")
    tools: list[MCPTool] | None = Field(
        default=None, description="Tools provided by the MCP template", sa_type=JSON
    )
    metadata: dict[str, Any] | None = Field(
        default=None,
        description="Additional metadata for the MCP template",
        sa_type=JSON,
    )


class MCPTemplateCreate(MCPTemplateBase):
    """Model for creating an MCP template."""

    pass


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
    metadata: dict[str, Any] | None = None


class MCPTemplate(MCPTemplateBase, SQLModel, table=True):
    """Model for MCP templates."""

    __tablename__ = "mcp_templates"

    id: str = Field(
        default_factory=nanoid.generate,
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


class MCPTemplateOut(MCPTemplateBase):
    """Model for MCP template output."""

    id: str
    created_at: datetime
    updated_at: datetime


class MCPTemplatesOut(CamelModel):
    """Model for MCP templates output."""

    data: list[MCPTemplateOut]
    count: int

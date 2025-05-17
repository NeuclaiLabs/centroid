"""MCP-related models."""

from app.models.mcp.server import (
    MCPRunConfig,
    MCPServer,
    MCPServerBase,
    MCPServerCreate,
    MCPServerOut,
    MCPServerOutWithTemplate,
    MCPServerSearch,
    MCPServersOut,
    MCPServersOutWithTemplate,
    MCPServerState,
    MCPServerStatus,
    MCPServerUpdate,
    MCPTool,
)
from app.models.mcp.template import (
    MCPTemplate,
    MCPTemplateBase,
    MCPTemplateCreate,
    MCPTemplateOut,
    MCPTemplatesOut,
    MCPTemplateUpdate,
)

from ..utils import generate_docker_style_name

__all__ = [
    # Base models and utilities
    "MCPRunConfig",
    "MCPServerSearch",
    "MCPServerStatus",
    "generate_docker_style_name",
    "MCPTool",
    "MCPServerState",
    # Server models
    "MCPServerBase",
    "MCPServerCreate",
    "MCPServerUpdate",
    "MCPServer",
    "MCPServerOut",
    "MCPServersOut",
    "MCPServerOutWithTemplate",
    "MCPServersOutWithTemplate",
    # Template models
    "MCPTemplateBase",
    "MCPTemplateCreate",
    "MCPTemplateUpdate",
    "MCPTemplate",
    "MCPTemplateOut",
    "MCPTemplatesOut",
]

MCPTemplateOut.model_rebuild()

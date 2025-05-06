"""
This file re-exports all MCP server models from the new modular structure.
"""

from app.models.mcp import (
    # Main model
    MCPServer,
    MCPServerBase,
    MCPServerCreate,
    # Base models and utilities
    MCPServerKind,
    # Output schemas
    MCPServerOut,
    MCPServerOutWithTemplate,
    MCPServerRunConfig,
    MCPServerSearch,
    MCPServersOut,
    MCPServersOutWithTemplate,
    MCPServerStatus,
    MCPServerUpdate,
    # Tool models
    MCPTool,
    generate_docker_style_name,
)

__all__ = [
    "MCPServerKind",
    "MCPServerRunConfig",
    "MCPServerSearch",
    "MCPServerStatus",
    "generate_docker_style_name",
    "MCPServerBase",
    "MCPServerCreate",
    "MCPServerUpdate",
    "MCPServer",
    "MCPTool",
    "MCPServerOut",
    "MCPServersOut",
    "MCPServerOutWithTemplate",
    "MCPServersOutWithTemplate",
]

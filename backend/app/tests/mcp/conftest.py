from unittest.mock import MagicMock, patch

import pytest
from sqlmodel import Session

from app.models import MCPInstance, MCPInstanceStatus
from app.models.tool_instance import ToolInstance, ToolInstanceStatus


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    return MagicMock(spec=Session)


@pytest.fixture
def mcp_instance():
    """Create a sample MCP instance."""
    return MCPInstance(
        id="test-mcp-id",
        name="Test MCP Instance",
        description="Test MCP instance for testing",
        status=MCPInstanceStatus.ACTIVE,
        url="http://localhost:8000",
        config={"timeout": 30},
        owner_id="test-owner-id",
    )


@pytest.fixture
def tool_instance(mcp_instance):
    """Create a sample tool instance."""
    return ToolInstance(
        id="test-tool-id",
        tool_schema={
            "name": "test_tool",
            "description": "A test tool",
            "parameters": {
                "properties": {
                    "param1": {
                        "type": "string",
                        "description": "Test parameter",
                    }
                },
                "required": ["param1"],
            },
        },
        tool_metadata={"version": "1.0.0"},
        config={"timeout": 30},
        status=ToolInstanceStatus.ACTIVE,
        mcp_instance_id=mcp_instance.id,
        owner_id="test-owner-id",
    )


@pytest.fixture
def mock_fastmcp_server():
    """Create a mock FastMCP server."""
    with patch("app.mcp.mcp_server.FastMCPServer") as mock:
        server = MagicMock()
        server._tool_manager._tools = {}
        server.tool.return_value = lambda func: func
        mock.return_value = server
        yield mock


@pytest.fixture
def mock_sse_transport():
    """Create a mock SSE transport."""
    with patch("app.mcp.mcp_server.SseServerTransport") as mock:
        transport = MagicMock()
        mock.return_value = transport
        yield mock


@pytest.fixture
def mock_mcp_server():
    """Create a mock MCP server."""
    with patch("app.mcp.mcp_manager.MCPServer") as mock:
        server = MagicMock()
        mock.return_value = server
        yield mock


@pytest.fixture
def mock_schema_to_function():
    """Create a mock schema_to_function."""
    with patch("app.mcp.openapi.schema_to_func.schema_to_function") as mock:
        func = MagicMock()
        mock.return_value = func
        yield mock

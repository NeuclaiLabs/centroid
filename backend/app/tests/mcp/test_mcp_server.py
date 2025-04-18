from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from sqlmodel import Session

from app.mcp.mcp_server import MCPServer, MCPServerConfig
from app.models.tool_instance import ToolInstance, ToolInstanceStatus


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    mock = MagicMock(spec=Session)
    # Make the mock work as a context manager
    mock.__enter__.return_value = mock
    mock.__exit__.return_value = None
    return mock


@pytest.fixture
def mock_fastmcp_server():
    """Create a mock FastMCP server."""
    with patch("app.mcp.mcp_server.FastMCPServer") as mock:
        server = MagicMock()
        server._tool_manager = MagicMock()
        server._tool_manager._tools = {}
        # Create a proper mock for the tool decorator
        tool_decorator = MagicMock()
        tool_decorator.return_value = lambda func: func
        server.tool = tool_decorator
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
def mcp_server_config():
    """Create a sample MCP server configuration."""
    return MCPServerConfig(
        id="test-mcp-id",
        name="Test MCP Server",
        mount_path="/test/mcp",
        description="Test MCP server for testing",
    )


@pytest.fixture
def mcp_server(mock_db, mcp_server_config, mock_fastmcp_server, mock_sse_transport):  # noqa: ARG001
    """Create an MCP server instance for testing."""
    return MCPServer(mock_db, mcp_server_config)


@pytest.fixture
def tool_instance():
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
        mcp_instance_id="test-mcp-id",
        owner_id="test-owner-id",
    )


@pytest.fixture
def mock_schema_to_function():
    """Create a mock schema_to_function."""
    with patch("app.mcp.mcp_server.schema_to_function") as mock:

        def create_mock_function(schema, metadata, config):  # noqa: ARG001
            # Create a mock function with the name from the schema
            mock_func = MagicMock()
            mock_func.__name__ = schema.get("name", "unknown_tool")
            return mock_func

        mock.side_effect = create_mock_function
        yield mock


class TestMCPServer:
    """Test suite for MCPServer class."""

    def test_initialization(
        self, mcp_server, mcp_server_config, mock_fastmcp_server, mock_sse_transport
    ):
        """Test MCP server initialization."""
        assert mcp_server.config == mcp_server_config
        assert mcp_server._tools == {}
        mock_fastmcp_server.assert_called_once_with(name=mcp_server_config.name)
        mock_sse_transport.assert_called_once_with(
            f"{mcp_server_config.mount_path}/messages/"
        )

    def test_register_tool(self, mcp_server, tool_instance, mock_schema_to_function):
        """Test registering a tool with the MCP server."""
        # Create a mock function with __name__ attribute
        mock_func = MagicMock()
        mock_func.__name__ = "test_tool"
        mock_schema_to_function.return_value = mock_func

        mcp_server.register_tool(tool_instance)

        # Check that the tool was registered with the server
        assert "test_tool" in mcp_server._tools
        assert mcp_server._tools["test_tool"] == tool_instance
        mock_schema_to_function.assert_called_once_with(
            tool_instance.tool_schema,
            tool_instance.tool_metadata or {},
            tool_instance.config or {},
        )

        # Verify that server.tool was called
        mcp_server.server.tool.assert_called_once()

    def test_register_tool_without_schema(self, mcp_server):
        """Test registering a tool without a schema raises an error."""
        tool = MagicMock(spec=ToolInstance)
        tool.tool_schema = None
        tool.status = ToolInstanceStatus.ACTIVE
        tool.mcp_instance_id = "test-mcp-id"
        tool.owner_id = "test-owner-id"

        with pytest.raises(ValueError, match="Tool instance must have a schema"):
            mcp_server.register_tool(tool)

    def test_register_tool_without_name(self, mcp_server):
        """Test registering a tool without a name in schema raises an error."""
        tool = MagicMock(spec=ToolInstance)
        tool.tool_schema = {}
        tool.status = ToolInstanceStatus.ACTIVE
        tool.mcp_instance_id = "test-mcp-id"
        tool.owner_id = "test-owner-id"

        with pytest.raises(ValueError, match="Tool schema must have a name"):
            mcp_server.register_tool(tool)

    def test_register_duplicate_tool(
        self, mcp_server, tool_instance, mock_schema_to_function
    ):
        """Test registering a duplicate tool raises an error."""
        mock_func = MagicMock()
        mock_schema_to_function.return_value = mock_func

        # Register the tool first time
        mcp_server.register_tool(tool_instance)

        # Try to register the same tool again
        with pytest.raises(
            ValueError, match="Tool with name 'test_tool' already exists"
        ):
            mcp_server.register_tool(tool_instance)

    def test_deregister_tool(self, mcp_server, tool_instance, mock_schema_to_function):
        """Test deregistering a tool from the MCP server."""
        mock_func = MagicMock()
        mock_schema_to_function.return_value = mock_func

        # Register the tool first
        mcp_server.register_tool(tool_instance)

        # Then deregister it
        mcp_server.deregister_tool("test_tool")

        # Check that the tool was removed
        assert "test_tool" not in mcp_server._tools
        assert "test_tool" not in mcp_server.server._tool_manager._tools

    def test_deregister_nonexistent_tool(self, mcp_server):
        """Test deregistering a nonexistent tool raises an error."""
        with pytest.raises(
            ValueError, match="Tool with name 'nonexistent_tool' not found"
        ):
            mcp_server.deregister_tool("nonexistent_tool")

    def test_get_tool(self, mcp_server, tool_instance, mock_schema_to_function):
        """Test getting a tool by name."""
        mock_func = MagicMock()
        mock_schema_to_function.return_value = mock_func

        # Register the tool
        mcp_server.register_tool(tool_instance)

        # Get the tool
        retrieved_tool = mcp_server.get_tool("test_tool")

        # Check that the correct tool was returned
        assert retrieved_tool == tool_instance

    def test_get_nonexistent_tool(self, mcp_server):
        """Test getting a nonexistent tool returns None."""
        assert mcp_server.get_tool("nonexistent_tool") is None

    def test_get_all_tools(self, mcp_server, tool_instance, mock_schema_to_function):
        """Test getting all tools."""
        mock_func = MagicMock()
        mock_schema_to_function.return_value = mock_func

        # Register the tool
        mcp_server.register_tool(tool_instance)

        # Get all tools
        all_tools = mcp_server.get_all_tools()

        # Check that the correct tools were returned
        assert len(all_tools) == 1
        assert all_tools[0] == tool_instance

    def test_mount(self, mcp_server, mcp_server_config):
        """Test mounting the MCP server to a FastAPI app."""
        # Create a mock FastAPI app
        app = MagicMock(spec=FastAPI)

        # Create mock routes
        mock_get_route = MagicMock()
        mock_get_route.path = mcp_server_config.mount_path
        mock_get_route.methods = {"GET"}

        mock_messages_route = MagicMock()
        mock_messages_route.path = f"{mcp_server_config.mount_path}/messages/"

        # Set up the routes list
        app.routes = [mock_get_route, mock_messages_route]

        # Mock the get and mount methods
        app.get = MagicMock()
        app.mount = MagicMock()

        mcp_server.mount(app)

        # Verify that get was called with the correct path
        app.get.assert_called_once_with(mcp_server_config.mount_path)

        # Verify that mount was called with the correct path and app
        app.mount.assert_called_once_with(
            f"{mcp_server_config.mount_path}/messages/",
            app=mcp_server.transport.handle_post_message,
        )

    def test_load_tools(
        self, mcp_server, mock_db, tool_instance, mock_schema_to_function
    ):
        """Test loading tools from the database."""
        # Mock the database query
        mock_db.exec.return_value.all.return_value = [tool_instance]

        # Create a mock function with __name__ attribute
        mock_func = MagicMock()
        mock_func.__name__ = "test_tool"
        mock_schema_to_function.return_value = mock_func

        # Load tools
        mcp_server.load_tools()

        # Check that the tool was loaded and registered
        assert "test_tool" in mcp_server._tools
        assert mcp_server._tools["test_tool"] == tool_instance

        # Verify that exec was called with the correct query
        assert mock_db.exec.call_count >= 1

    def test_handle_status_change_new_active(
        self, mcp_server, tool_instance, mock_schema_to_function
    ):
        """Test handling status change for a new active tool."""
        # Handle status change
        mcp_server.handle_status_change(tool_instance, None)

        # Check that the tool was registered
        assert "test_tool" in mcp_server._tools
        assert mcp_server._tools["test_tool"] == tool_instance

    def test_handle_status_change_new_inactive(self, mcp_server, tool_instance):
        """Test handling status change for a new inactive tool."""
        # Set the tool status to inactive
        tool_instance.status = ToolInstanceStatus.INACTIVE

        # Handle status change
        mcp_server.handle_status_change(tool_instance, None)

        # Check that the tool was not registered
        assert "test_tool" not in mcp_server._tools

    def test_handle_status_change_to_active(
        self, mcp_server, tool_instance, mock_schema_to_function
    ):
        """Test handling status change to active."""
        # First register the tool as inactive
        tool_instance.status = ToolInstanceStatus.INACTIVE
        mcp_server._tools["test_tool"] = tool_instance

        # Then change status to active
        tool_instance.status = ToolInstanceStatus.ACTIVE

        # Handle status change
        mcp_server.handle_status_change(tool_instance, ToolInstanceStatus.INACTIVE)

        # Check that the tool was registered
        assert "test_tool" in mcp_server._tools
        assert mcp_server._tools["test_tool"] == tool_instance

    def test_handle_status_change_to_inactive(
        self, mcp_server, tool_instance, mock_schema_to_function
    ):
        """Test handling status change to inactive."""
        # First register the tool as active
        mock_func = MagicMock()
        mock_schema_to_function.return_value = mock_func

        mcp_server.register_tool(tool_instance)

        # Then change status to inactive
        tool_instance.status = ToolInstanceStatus.INACTIVE

        # Handle status change
        mcp_server.handle_status_change(tool_instance, ToolInstanceStatus.ACTIVE)

        # Check that the tool was deregistered
        assert "test_tool" not in mcp_server._tools
        assert "test_tool" not in mcp_server.server._tool_manager._tools

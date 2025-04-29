from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlmodel import Session

from app.mcp.mcp_manager import MCPManager, RegistryEntry
from app.mcp.mcp_server import MCPServerConfig
from app.models import MCPInstance, MCPInstanceStatus, MCPServer, MCPServerStatus


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    return MagicMock(spec=Session)


@pytest.fixture
def mock_mcp_server():
    """Create a mock MCP server."""
    with patch("app.mcp.mcp_manager.MCPServer") as mock:
        server = MagicMock()
        mock.return_value = server
        yield mock


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
def registry_entry(mcp_instance, mock_mcp_server):
    """Create a sample registry entry."""
    return RegistryEntry(
        id=mcp_instance.id,
        url=mcp_instance.url,
        mount_path=mcp_instance.mount_path,
        config=mcp_instance.config or {},
        health_status="healthy",
        mcp_server=mock_mcp_server.return_value,
    )


@pytest.fixture
def mcp_server_config():
    """Create a sample MCP server configuration."""
    return MCPServer(
        id="test-mcp-id",
        name="Test MCP Server",
        description="Test MCP server configuration for testing",
        status=MCPServerStatus.ACTIVE,
        url="http://localhost:8000",
        settings={"timeout": 30},
        owner_id="test-owner-id",
    )


@pytest.fixture(autouse=True)
def reset_mcp_manager():
    """Reset the MCPManager singleton and registry before each test."""
    # Reset the singleton instance
    MCPManager._server = None
    # Reset the registry
    MCPManager._registry = {}
    yield
    # Clean up after the test
    MCPManager._server = None
    MCPManager._registry = {}


class TestMCPManager:
    """Test suite for MCPManager class."""

    def test_singleton_pattern(self, mock_db):
        """Test that MCPManager follows the singleton pattern."""
        # Get two instances
        manager1 = MCPManager()
        manager2 = MCPManager()

        # Check that they are the same instance
        assert manager1 is manager2

    @pytest.mark.asyncio
    async def test_register_mcp(self, mock_db, mcp_instance, mock_mcp_server):
        """Test registering an MCP instance."""
        manager = MCPManager()
        manager.set_session(mock_db)

        # Register the MCP instance
        await manager._register_instance(mcp_instance)

        # Check that the MCP server was initialized and registered
        expected_config = MCPServerConfig(
            id=mcp_instance.id,
            name=mcp_instance.name,
            base_url=mcp_instance.url,
            mount_path=mcp_instance.mount_path,
            description=mcp_instance.description,
            metadata=mcp_instance.config or {},
        )
        mock_mcp_server.assert_called_once_with(mock_db, expected_config)
        assert mcp_instance.id in manager._registry
        assert (
            manager._registry[mcp_instance.id]["mcp_server"]
            == mock_mcp_server.return_value
        )

    @pytest.mark.asyncio
    async def test_register_duplicate_mcp(self, mock_db, mcp_instance, mock_mcp_server):
        """Test registering a duplicate MCP instance raises an error."""
        manager = MCPManager()
        manager.set_session(mock_db)

        # Register the MCP instance first time
        await manager._register_instance(mcp_instance)

        # Try to register the same instance again
        with pytest.raises(
            ValueError, match=f"MCP instance with ID '{mcp_instance.id}' already exists"
        ):
            await manager._register_instance(mcp_instance)

    @pytest.mark.asyncio
    async def test_deregister_mcp(self, mock_db, mcp_instance, mock_mcp_server):
        """Test deregistering an MCP instance."""
        manager = MCPManager()
        manager.set_session(mock_db)

        # Set up the mock MCP server with the expected structure
        mock_server = mock_mcp_server.return_value
        mock_server.server = MagicMock()
        mock_server.server._mcp_server = MagicMock()
        mock_server.server._mcp_server.close_sessions = AsyncMock()
        mock_server.transport = MagicMock()
        mock_server.transport.close_connections = AsyncMock()

        # Register the MCP instance first
        await manager._register_instance(mcp_instance)

        # Then deregister it
        await manager._deregister_instance(mcp_instance.id)

        # Check that the MCP server was deregistered
        assert mcp_instance.id not in manager._registry
        # Verify that the appropriate cleanup methods were called
        mock_server.server._mcp_server.close_sessions.assert_called_once()
        mock_server.transport.close_connections.assert_called_once()

    @pytest.mark.asyncio
    async def test_deregister_nonexistent_mcp(self, mock_db):
        """Test deregistering a nonexistent MCP instance raises an error."""
        manager = MCPManager()
        manager.set_session(mock_db)

        with pytest.raises(
            ValueError, match="MCP instance with ID 'nonexistent-id' not found"
        ):
            await manager._deregister_instance("nonexistent-id")

    @pytest.mark.asyncio
    async def test_health_check(self, mock_db, mcp_instance, mock_mcp_server):
        """Test performing a health check on an MCP instance."""
        manager = MCPManager()
        manager.set_session(mock_db)

        # Register the MCP instance
        await manager._register_instance(mcp_instance)

        # Mock the health check response
        mock_mcp_server.return_value.server.health_check.return_value = True

        # Perform health check
        result = await manager.health_check(mcp_instance.id)

        # Check that the health check was performed
        assert result is True
        # mock_mcp_server.return_value.server.health_check.assert_called_once()

    @pytest.mark.asyncio
    async def test_health_check_nonexistent_mcp(self, mock_db):
        """Test performing a health check on a nonexistent MCP instance raises an error."""
        manager = MCPManager()
        manager.set_session(mock_db)

        with pytest.raises(
            ValueError, match="MCP instance with ID 'nonexistent-id' not found"
        ):
            await manager.health_check("nonexistent-id")

    @pytest.mark.asyncio
    async def test_register_server_config(self, mock_db, mcp_server_config):
        """Test registering an MCP server configuration and creating its proxy."""
        manager = MCPManager()
        manager.set_session(mock_db)

        # Register the MCP server configuration
        await manager._register_server(mcp_server_config)

        # Check that the proxy was created and registered
        assert mcp_server_config.id in manager._registry
        proxy = manager._registry[mcp_server_config.id]
        assert proxy.mcp_server_config == mcp_server_config
        assert proxy.mount_path == mcp_server_config.mount_path

    @pytest.mark.asyncio
    async def test_register_duplicate_server_config(self, mock_db, mcp_server_config):
        """Test registering a duplicate MCP server configuration raises an error."""
        manager = MCPManager()
        manager.set_session(mock_db)

        # Register the MCP server configuration first time
        await manager._register_server(mcp_server_config)

        # Try to register the same configuration again
        with pytest.raises(
            ValueError,
            match=f"MCP server configuration '{mcp_server_config.id}' already exists",
        ):
            await manager._register_server(mcp_server_config)

    @pytest.mark.asyncio
    async def test_deregister_server_config(self, mock_db, mcp_server_config):
        """Test deregistering an MCP server configuration and its proxy."""
        manager = MCPManager()
        manager.set_session(mock_db)

        # Register the MCP server configuration first
        await manager._register_server(mcp_server_config)

        # Then deregister it
        await manager._deregister_server(mcp_server_config.id)

        # Check that the proxy was deregistered
        assert mcp_server_config.id not in manager._registry

    @pytest.mark.asyncio
    async def test_deregister_nonexistent_server_config(self, mock_db):
        """Test deregistering a nonexistent MCP server configuration raises an error."""
        manager = MCPManager()
        manager.set_session(mock_db)

        with pytest.raises(
            ValueError, match="MCP server with ID 'nonexistent-id' not found"
        ):
            await manager._deregister_server("nonexistent-id")

    @pytest.mark.asyncio
    async def test_health_check_nonexistent_server_config(self, mock_db):
        """Test performing a health check on a nonexistent MCP server configuration raises an error."""
        manager = MCPManager()
        manager.set_session(mock_db)

        with pytest.raises(
            ValueError, match="MCP server with ID 'nonexistent-id' not found"
        ):
            await manager.health_check("nonexistent-id")

    # @pytest.mark.asyncio
    # async def test_prepare_instance_registry(
    #     self, mock_db, mcp_instance, mock_mcp_server
    # ):
    #     """Test preparing an instance registry entry."""
    #     # Reset the singleton instance
    #     MCPManager._instance = None

    #     # Get the manager instance
    #     manager = MCPManager.get_instance()

    #     # Set the session
    #     manager.set_session(mock_db)

    #     # Prepare the registry entry
    #     registry_entry = await manager._prepare_instance_registry(
    #         mcp_instance, mock_mcp_server.return_value
    #     )

    #     # Check that the registry entry was prepared correctly
    #     assert registry_entry["id"] == mcp_instance.id
    #     assert registry_entry["url"] == mcp_instance.url
    #     assert registry_entry["mount_path"] == mcp_instance.mount_path
    #     assert registry_entry["config"] == mcp_instance.config or {}
    #     assert registry_entry["health_status"] == "healthy"
    #     assert registry_entry["mcp_server"] == mock_mcp_server.return_value

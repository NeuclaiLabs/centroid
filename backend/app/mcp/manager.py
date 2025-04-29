import logging
import threading

from fastmcp.client import Client
from sqlmodel import Session

from app.mcp.proxy import MCPProxy
from app.models import MCPServer, MCPServerStatus

logger = logging.getLogger(__name__)


class MCPManager:
    _server = None
    _lock = threading.Lock()
    _registry: dict[str, MCPProxy] = {}
    _session: Session | None = None

    def __new__(cls):
        with cls._lock:
            if cls._server is None:
                cls._server = super().__new__(cls)
            return cls._server

    @classmethod
    def get_server(cls) -> "MCPManager":
        if cls._server is None:
            with cls._lock:
                # Double-check pattern to prevent race conditions
                if cls._server is None:
                    cls._server = cls()
        return cls._server

    def set_session(self, session: Session) -> None:
        """Set the database session for the MCP manager."""
        self._session = session

    async def initialize(self, session: Session) -> None:
        """Load all active MCP server configurations on startup"""
        # Store the session for future use
        self.set_session(session)

        active_servers = (
            session.query(MCPServer)
            .filter(MCPServer.status == MCPServerStatus.ACTIVE)
            .all()
        )
        # Initialize proxies for all active server configurations
        for server_config in active_servers:
            await self._register_server(server_config)

    async def _register_server(self, server_config: MCPServer) -> None:
        """Register a single MCP server configuration and create its proxy"""
        try:
            # Check if a proxy for this server configuration already exists
            if server_config.id in self._registry:
                logger.warning(
                    f"Proxy for MCP server configuration {server_config.id} already exists. Skipping registration."
                )
                raise ValueError(
                    f"MCP server configuration '{server_config.id}' already exists"
                )

            # Create a client for the MCP server
            client = Client(server_config.url)

            # Create the proxy with the server configuration
            proxy = await MCPProxy.create(
                client=client,
                mcp_server_config=server_config,
                mount_path=server_config.mount_path,
            )

            # Store the proxy in the registry
            self._registry[server_config.id] = proxy

        except Exception as e:
            logger.error(
                f"Failed to register MCP server configuration {server_config.id}: {e}"
            )
            raise

    async def _deregister_server(self, server_id: str) -> None:
        """Deregister an MCP server"""
        if server_id not in self._registry:
            raise ValueError(f"MCP server with ID '{server_id}' not found")

        try:
            # Get the registry entry
            registry_entry = self._registry[server_id]
            mcp_server = registry_entry["mcp_server"]

            # Clean up the MCP server resources
            # FastMCP server uses SSE transport which needs proper cleanup
            if hasattr(mcp_server, "server") and hasattr(
                mcp_server.server, "_mcp_server"
            ):
                # Close any active sessions in the MCP server
                if hasattr(mcp_server.server._mcp_server, "close_sessions"):
                    await mcp_server.server._mcp_server.close_sessions()

            # Clean up the transport layer if it exists
            if hasattr(mcp_server, "transport"):
                # Close any active connections in the transport
                if hasattr(mcp_server.transport, "close_connections"):
                    await mcp_server.transport.close_connections()
                # Close the transport itself if it has a close method
                elif hasattr(mcp_server.transport, "close"):
                    await mcp_server.transport.close()

            # Remove the MCP server from the registry
            del self._registry[server_id]
            logger.info(f"MCP server {server_id} deregistered and resources cleaned up")
        except Exception as e:
            logger.error(f"Error during deregistration of MCP server {server_id}: {e}")
            # Still remove from registry even if cleanup fails
            del self._registry[server_id]
            logger.info(
                f"MCP server {server_id} removed from registry despite cleanup error"
            )

    async def health_check(self, server_id: str) -> bool:
        """Periodic health check of active MCP servers"""
        if not self._session:
            logger.error("No database session available for health check")
            return False
        if server_id not in self._registry:
            raise ValueError(f"MCP server with ID '{server_id}' not found")
        registry_entry = self._registry[server_id]
        try:
            is_healthy = await self._check_mcp_health(server_id)

            if not is_healthy:
                await self._handle_server_failure(server_id)
            return is_healthy
        except Exception as e:
            logger.error(f"Health check failed for MCP server {server_id}: {e}")
            registry_entry["health_status"] = "unhealthy"
            return False

    async def _check_mcp_health(self, server_id: str) -> bool:
        """Check if an MCP server is healthy"""
        try:
            # Implement actual health check logic here
            # For example, make an HTTP request to the MCP's health endpoint
            return True
        except Exception as e:
            logger.error(f"Health check failed for MCP {server_id}: {e}")
            return False

    def get_registry_entry(self, server_id: str) -> MCPServer | None:
        """
        Get a registry entry by ID.

        Args:
            server_id: The ID of the registry entry to get

        Returns:
            The registry entry or None if not found
        """
        return self._registry.get(server_id)

    def get_mcp_server(self, server_id: str) -> MCPServer | None:
        """
        Get an MCP server server by ID.

        Args:
            server_id: The ID of the MCP server to get

        Returns:
            The MCP server server or None if not found
        """
        registry_entry = self._registry.get(server_id)
        if registry_entry:
            return registry_entry["mcp_server"]
        return None

    def get_all_registry_entries(self) -> dict[str, MCPServer]:
        """
        Get all registry entries.

        Returns:
            A dictionary of all registry entries

        Note:
            This method returns a reference to the internal registry dictionary.
            Modifying the returned dictionary will affect the internal state of the MCPManager.
            For thread safety, consider using the get_registry_entry method for individual entries.
        """
        return self._registry

import asyncio
import threading

from fastapi import FastAPI
from sqlmodel import Session

from app.core.logger import get_logger
from app.mcp.proxy import MCPProxy
from app.models import MCPServer

logger = get_logger(__name__)


class MCPManager:
    _server = None
    _lock = threading.Lock()
    _registry: dict[str, MCPProxy] = {}
    _db_session: Session | None = None
    _app: FastAPI | None = None

    def __new__(cls):
        with cls._lock:
            if cls._server is None:
                cls._server = super().__new__(cls)
            return cls._server

    @classmethod
    def get_singleton(cls) -> "MCPManager":
        if cls._server is None:
            with cls._lock:
                # Double-check pattern to prevent race conditions
                if cls._server is None:
                    cls._server = cls()
        return cls._server

    def set_app(self, app: FastAPI) -> None:
        self._app = app

    def set_session(self, session: Session) -> None:
        self._db_session = session

    async def initialize(self, servers: list[MCPServer]) -> None:
        """
        Load all active MCP server configurations on startup in parallel

        Args:
            servers: List of active MCP servers to initialize
        """
        if not servers:
            logger.info("No active servers to initialize")
            return

        logger.info(f"Initializing {len(servers)} MCP servers in parallel")

        # Start all servers in parallel
        await asyncio.gather(*[self.start_server(server) for server in servers])

        # Log the results
        started_count = sum(
            1 for server_id, proxy in self._registry.items() if proxy.state == "running"
        )
        logger.info(
            f"Successfully initialized {started_count}/{len(servers)} MCP servers"
        )

    async def start_server(self, server: MCPServer) -> MCPProxy | None:
        """
        Start an MCP server and register it in the manager.

        This method creates and initializes a new MCPProxy instance for the server
        and adds it to the registry.

        Args:
            server: The MCP server to start

        Returns:
            MCPProxy | None: The initialized proxy instance or None if failed
        """
        logger.info(f"Starting MCP server: '{server.id}'")

        # Check if we already have a proxy for this server
        if server.id in self._registry:
            proxy = self._registry[server.id]
            if proxy.state in ["running", "initializing"]:
                logger.warning(f"Server {server.id} is already {proxy.state}")
                return proxy

        try:
            # Create a new proxy instance
            from app.mcp.proxy import MCPProxy

            proxy = MCPProxy(mcp_server=server)
            proxy.mount(self._app)

            # Initialize the proxy
            success = await proxy.initialize()

            if success:
                # Add to registry
                self._registry[server.id] = proxy
                logger.info(f"Successfully started MCP server {server.id}")
                return proxy
            else:
                logger.error(f"Failed to start MCP server {server.id}")
                return None

        except Exception as e:
            logger.error(f"Error starting MCP server {server.id}: {e}")
            return None

    async def stop_server(self, server: MCPServer) -> bool:
        """
        Stop an MCP server and remove it from the registry.

        This method shuts down the proxy instance for the server and removes it from the registry.

        Args:
            server_id: The ID of the MCP server to stop

        Returns:
            bool: True if successful, False otherwise
        """
        logger.info(f"Stopping MCP server '{server.id}'")

        # Get the proxy from the registry
        proxy = self._registry.get(server.id)
        if not proxy:
            logger.warning(f"No proxy found for server {server.id}")
            return True

        try:
            # Shutdown the proxy
            success = await proxy.shutdown()

            if success:
                # Remove from registry if shutdown was successful
                if server.id in self._registry:
                    del self._registry[server.id]
                logger.info(f"Successfully stopped MCP server {server.id}")
                return True
            else:
                logger.error(f"Failed to stop MCP server {server.id}")
                return False

        except Exception as e:
            logger.error(f"Error stopping MCP server {server.id}: {e}")
            return False

    async def restart_server(self, server: MCPServer) -> bool:
        """
        Restart the MCP server.

        Args:
            server: The MCP server to restart

        Returns:
            bool: True if successful, False otherwise
        """
        logger.info(f"Restarting MCP server '{server.id}'")

        # Stop the server
        stop_result = await self.stop_server(server.id)

        if not stop_result:
            logger.error(f"Failed to stop MCP server {server.id} during restart")
            return False

        # Small delay to ensure resources are released
        await asyncio.sleep(1)

        # Start the server again
        proxy = await self.start_server(server)
        return proxy is not None

    def get_mcp_proxy(self, server_id: str) -> MCPProxy | None:
        """
        Get an MCP proxy by server ID.

        Args:
            server_id: The ID of the MCP server

        Returns:
            The MCP proxy or None if not found
        """
        return self._registry.get(server_id)

    async def shutdown(self) -> None:
        """
        Shut down all active MCP servers in parallel

        This method stops all servers currently in the registry.
        """
        server_ids = list(self._registry.keys())

        if not server_ids:
            logger.info("No active servers to shut down")
            return

        logger.info(f"Shutting down {len(server_ids)} MCP servers in parallel")

        # Define a helper function to safely stop a single server
        async def stop_single_server(server_id: str) -> bool:
            try:
                return await self.stop_server(server_id)
            except Exception as e:
                logger.error(f"Error stopping server {server_id}: {e}")
                return False

        # Stop all servers in parallel
        results = await asyncio.gather(
            *[stop_single_server(server_id) for server_id in server_ids]
        )

        # Log the results
        success_count = sum(1 for result in results if result)
        logger.info(
            f"Successfully shut down {success_count}/{len(server_ids)} MCP servers"
        )

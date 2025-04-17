import asyncio
import logging
import threading
from typing import Any, TypedDict

from fastapi import BackgroundTasks
from sqlmodel import Session

from app.mcp.mcp_server import MCPServer, MCPServerConfig
from app.models import MCPInstance, MCPInstanceStatus

logger = logging.getLogger(__name__)


class RegistryEntry(TypedDict):
    """Type definition for an MCP instance registry entry."""

    id: str
    url: str
    mount_path: str
    config: dict[str, Any]
    health_status: str
    mcp_server: MCPServer


class MCPManager:
    _instance = None
    _lock = threading.Lock()
    _registry: dict[str, RegistryEntry] = {}
    _session: Session = None

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
            return cls._instance

    @classmethod
    def get_instance(cls) -> "MCPManager":
        if cls._instance is None:
            with cls._lock:
                # Double-check pattern to prevent race conditions
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def set_session(self, session: Session) -> None:
        """Set the database session for the MCP manager."""
        self._session = session

    async def initialize(self, session: Session) -> None:
        """Load all active MCP instances on startup"""
        # Store the session for future use
        self.set_session(session)

        active_instances = (
            session.query(MCPInstance)
            .filter(MCPInstance.status == MCPInstanceStatus.ACTIVE)
            .all()
        )

        for instance in active_instances:
            await self._register_instance(instance)

    async def _register_instance(self, instance: MCPInstance) -> None:
        """Register a single MCP instance"""
        try:
            # Check if an instance with this ID already exists in the registry
            if instance.id in self._registry:
                logger.warning(
                    f"MCP instance with ID {instance.id} already exists in registry. Skipping registration."
                )
                raise ValueError(f"MCP instance with ID '{instance.id}' already exists")

            # Create MCP server configuration
            server_config = MCPServerConfig(
                id=instance.id,
                name=instance.name or f"mcp-{instance.id}",
                base_url=instance.url,
                mount_path=instance.mount_path,
                description=instance.description or "",
                metadata=instance.config or {},
            )

            # Create the MCP server with only the config
            mcp_server = MCPServer(self._session, server_config)

            # Initialize the instance registry entry
            registry_entry = await self._prepare_instance_registry(instance, mcp_server)
            self._registry[instance.id] = registry_entry

            logger.info(f"MCP instance {instance.id} registered successfully")

        except Exception as e:
            logger.error(f"Failed to register MCP instance {instance.id}: {e}")
            raise

    async def _prepare_instance_registry(
        self, instance: MCPInstance, mcp_server: MCPServer
    ) -> RegistryEntry:
        """Prepare instance registry entry with MCP server and metadata"""
        return {
            "id": instance.id,
            "url": instance.url,
            "mount_path": instance.mount_path,
            "config": instance.config or {},
            "health_status": "healthy",
            "mcp_server": mcp_server,  # Store the MCP server instance
        }

    async def _deregister_instance(self, instance_id: str) -> None:
        """Deregister an MCP instance"""
        if instance_id not in self._registry:
            raise ValueError(f"MCP instance with ID '{instance_id}' not found")

        try:
            # Get the registry entry
            registry_entry = self._registry[instance_id]
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

            # Remove the MCP instance from the registry
            del self._registry[instance_id]
            logger.info(
                f"MCP instance {instance_id} deregistered and resources cleaned up"
            )
        except Exception as e:
            logger.error(
                f"Error during deregistration of MCP instance {instance_id}: {e}"
            )
            # Still remove from registry even if cleanup fails
            del self._registry[instance_id]
            logger.info(
                f"MCP instance {instance_id} removed from registry despite cleanup error"
            )

    async def health_check(self, instance_id: str) -> bool:
        """Periodic health check of active MCP instances"""
        if not self._session:
            logger.error("No database session available for health check")
            return False
        if instance_id not in self._registry:
            raise ValueError(f"MCP instance with ID '{instance_id}' not found")
        registry_entry = self._registry[instance_id]
        try:
            is_healthy = await self._check_mcp_health(instance_id)

            if not is_healthy:
                await self._handle_instance_failure(instance_id)
            return is_healthy
        except Exception as e:
            logger.error(f"Health check failed for MCP instance {instance_id}: {e}")
            registry_entry["health_status"] = "unhealthy"
            return False

    async def _check_mcp_health(self, instance_id: str) -> bool:
        """Check if an MCP instance is healthy"""
        try:
            # Implement actual health check logic here
            # For example, make an HTTP request to the MCP's health endpoint
            return True
        except Exception as e:
            logger.error(f"Health check failed for MCP {instance_id}: {e}")
            return False

    async def _handle_instance_failure(self, instance_id: str) -> None:
        """Handle MCP instance failure and attempt recovery"""
        if not self._session:
            logger.error("No database session available for instance failure handling")
            return

        try:
            instance = self._session.get(MCPInstance, instance_id)
            if instance:
                await self._register_instance(instance)
            else:
                await self._deregister_instance(instance_id)
        except Exception as e:
            logger.error(f"Recovery failed for MCP instance {instance_id}: {e}")

    @classmethod
    def schedule_health_checks(cls, background_tasks: BackgroundTasks) -> None:
        """Schedule periodic health checks"""

        async def run_health_checks():
            # Import here to avoid circular imports
            from app.api.deps import get_db

            while True:
                # Get a new session for each health check run
                for session in get_db():
                    manager = cls.get_instance()
                    # Set the session for this health check run
                    manager.set_session(session)
                    await manager.health_check()
                    break  # Only use the first session
                await asyncio.sleep(300)  # Run every 5 minutes

        background_tasks.add_task(run_health_checks)

    async def reload_mcp_server(self, instance_id: str) -> bool:
        """
        Reload an MCP server given its ID.

        This method will:
        1. Retrieve the current registry entry for the MCP server
        2. Deregister the existing MCP server
        3. Create a new MCP server with the same configuration
        4. Update the registry with the new MCP server

        Args:
            instance_id: The ID of the MCP server to reload

        Returns:
            bool: True if the reload was successful, False otherwise
        """
        if not self._session:
            logger.error("No database session available for MCP server reload")
            return False

        try:
            # Check if the MCP server exists in the registry
            if instance_id not in self._registry:
                logger.error(f"MCP server with ID {instance_id} not found in registry")
                return False

            # Get the MCP instance from the database

            instance = self._registry[instance_id]["mcp_server"]
            if not instance:
                logger.error(
                    f"MCP instance with ID {instance_id} not found in database"
                )
                return False

            await instance.create_tools()

            logger.info(f"MCP server {instance_id} reloaded successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to reload MCP server {instance_id}: {e}")
            return False

    def get_registry_entry(self, instance_id: str) -> RegistryEntry | None:
        """
        Get a registry entry by ID.

        Args:
            instance_id: The ID of the registry entry to get

        Returns:
            The registry entry or None if not found
        """
        return self._registry.get(instance_id)

    def get_mcp_server(self, instance_id: str) -> MCPServer | None:
        """
        Get an MCP server instance by ID.

        Args:
            instance_id: The ID of the MCP server to get

        Returns:
            The MCP server instance or None if not found
        """
        registry_entry = self._registry.get(instance_id)
        if registry_entry:
            return registry_entry["mcp_server"]
        return None

    def get_all_registry_entries(self) -> dict[str, RegistryEntry]:
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

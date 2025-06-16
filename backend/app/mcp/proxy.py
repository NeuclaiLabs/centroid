from datetime import datetime
from typing import Any, Literal

import mcp.types
from fastmcp import FastMCP
from fastmcp.client import Client
from fastmcp.client.transports import StdioTransport
from fastmcp.server.proxy import FastMCPProxy
from fastmcp.tools.tool import Tool
from mcp.shared.exceptions import McpError
from mcp.types import (
    METHOD_NOT_FOUND,
)

from app.core.logger import get_logger
from app.mcp.queue_manager import queue_manager
from app.models.mcp.server import MCPServer

logger = get_logger(__name__)


def _proxy_passthrough():
    pass


class ProxyTool(Tool):
    def __init__(self, client: Client, **kwargs):
        super().__init__(**kwargs)
        self._client = client

    @classmethod
    async def from_client(cls, client: Client, tool: mcp.types.Tool):
        return cls(
            client=client,
            name=tool.name,
            description=tool.description,
            parameters=tool.inputSchema,
            fn=_proxy_passthrough,
            is_async=True,
        )


class MCPProxy(FastMCPProxy):
    def __init__(
        self,
        mcp_server: MCPServer,
        tool_group: str = None,
        **kwargs,
    ):
        self.mcp_server = mcp_server
        self.client_initialized = False

        # Runtime state variables moved from MCPServer
        self.state: Literal[
            "pending",
            "initializing",
            "running",
            "stopping",
            "stopped",
            "restarting",
            "terminated",
            "shutting-down",
            "disconnected",
            "error",
        ] = "pending"
        self.last_ping_time: datetime | None = None
        self.connection_errors: dict[str, Any] = {
            "count": 0,
            "last_error": None,
        }
        self.stats: dict[str, Any] = {
            "requests": 0,
            "errors": 0,
            "last_response_time": None,
        }
        self.tool_group = tool_group
        logger.info(f"Initializing MCP proxy for server {self.mcp_server.id}")
        self.client = Client(
            transport=StdioTransport(
                command=self.mcp_server.run.command,
                cwd=self.mcp_server.run.cwd,
                env={
                    **(self.mcp_server.run.env or {}),
                    **(self.mcp_server.secrets or {}),
                },
                args=self.mcp_server.run.args,
            ),
        )

        super().__init__(self.client, **kwargs)
        logger.info(
            f"MCP proxy instance created for server {self.mcp_server.id} with state: {self.state}"
        )

    async def initialize(self) -> bool:
        """
        Initialize the client connection asynchronously.

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if not self.client_initialized:
                prev_state = self.state
                self.state = "initializing"
                logger.info(
                    f"State transition: {prev_state} → {self.state} for server {self.mcp_server.id}"
                )
                logger.info(f"Initializing MCP server {self.mcp_server.id}...")

                await self.client.__aenter__()
                self.client_initialized = True
                prev_state = self.state
                self.state = "running"
                logger.info(
                    f"State transition: {prev_state} → {self.state} for server {self.mcp_server.id}"
                )
                self.last_ping_time = datetime.now()

                logger.info(
                    f"Successfully initialized MCP proxy for server {self.mcp_server.id}"
                )
                return True
            return True
        except Exception as e:
            prev_state = self.state
            self.state = "error"
            logger.critical(
                f"State transition: {prev_state} → {self.state} for server {self.mcp_server.id} due to error: {str(e)}"
            )
            self.connection_errors["count"] += 1
            self.connection_errors["last_error"] = str(e)
            logger.error(
                f"Error initializing MCP proxy for server {self.mcp_server.id}: {e}"
            )
            return False

    async def shutdown(self) -> bool:
        """
        Clean up the client connection asynchronously.

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            prev_state = self.state
            self.state = "stopping"
            logger.info(
                f"State transition: {prev_state} → {self.state} for server {self.mcp_server.id}"
            )
            logger.info(f"Shutting down MCP server {self.mcp_server.id}...")

            if self.client_initialized:
                logger.info(f"Shutting down MCP proxy for server {self.mcp_server.id}")
                try:
                    # Create a new task in the same event loop
                    await self.client.__aexit__(None, None, None)
                    async with self.client:
                        pass
                except Exception as e:
                    logger.critical(
                        f"Error during client cleanup for server {self.mcp_server.id}: {e}"
                    )
                finally:
                    self.client_initialized = False
                    logger.info(
                        f"Client connection marked as uninitialized for server {self.mcp_server.id}"
                    )

            prev_state = self.state
            self.state = "stopped"
            logger.info(
                f"State transition: {prev_state} → {self.state} for server {self.mcp_server.id}"
            )
            logger.info(
                f"Successfully shut down MCP proxy for server {self.mcp_server.id}"
            )
            return True
        except Exception as e:
            prev_state = self.state
            self.state = "error"
            logger.critical(
                f"State transition: {prev_state} → {self.state} for server {self.mcp_server.id} due to error: {str(e)}"
            )
            self.connection_errors["count"] += 1
            self.connection_errors["last_error"] = str(e)
            logger.error(
                f"Error shutting down MCP proxy for server {self.mcp_server.id}: {e}"
            )
            return False

    def get_transport_key(self) -> str:
        """Get a unique key for storing transports."""
        return f"{self.mcp_server.id}"

    async def get_tools(self) -> dict[str, Tool]:
        tools = await super().get_tools()
        server_tools = {tool.name: tool for tool in (self.mcp_server.tools or [])}

        try:
            logger.info(
                f"Fetching available tools from client for server {self.mcp_server.id}"
            )
            client_tools = await self.client.list_tools()
            logger.info(
                f"Found {len(client_tools)} tools from client for server {self.mcp_server.id}"
            )
        except McpError as e:
            if e.error.code == METHOD_NOT_FOUND:
                logger.warning(
                    f"Method list_tools not found for server {self.mcp_server.id}"
                )
                client_tools = []
            else:
                logger.critical(
                    f"Error listing tools for server {self.mcp_server.id}: {e}"
                )
                raise e

        for tool in client_tools:
            if tool.name in server_tools and not server_tools[tool.name].status:
                logger.info(
                    f"Skipping tool {tool.name} because it is not enabled in the server configuration"
                )
                del tools[tool.name]
            else:
                tool_proxy = await ProxyTool.from_client(self.client, tool)
                tools[tool_proxy.name] = tool_proxy
                logger.debug(
                    f"Added tool proxy for {tool.name} in server {self.mcp_server.id}"
                )

        logger.info(f"Returning {len(tools)} tools for server {self.mcp_server.id}")
        return tools

    async def _mcp_call_tool(self, key: str, arguments: dict[str, Any]) -> Any:
        """Call a tool with the given arguments using Redis queue, respecting MCP server tool configuration."""
        try:
            # Check if tool is configured and enabled in MCP server
            server_tools = {tool.name: tool for tool in (self.mcp_server.tools or [])}
            if key in server_tools and not server_tools[key].status:
                logger.warning(
                    f"Attempt to call disabled tool {key} on server {self.mcp_server.id}"
                )
                raise McpError(
                    error=mcp.types.Error(
                        code="TOOL_DISABLED",
                        message=f"Tool {key} is disabled in MCP server configuration",
                    )
                )

            # Execute tool call via queue
            logger.info(
                f"Queueing tool {key} with arguments {arguments} on server {self.mcp_server.id}"
            )
            self.stats["requests"] += 1
            start_time = datetime.now()

            if not self.client.is_connected():
                logger.critical(
                    f"Tool call attempted on disconnected client for server {self.mcp_server.id}"
                )
                return []

            # Enqueue the tool call and wait for result
            request_id = await queue_manager.enqueue_tool_call(
                proxy_id=self.mcp_server.id,
                tool_name=key,
                arguments=arguments,
                timeout=300,
            )

            # Wait for the result from the queue
            result = await queue_manager.wait_for_result(request_id, timeout=300)
            response_time = (datetime.now() - start_time).total_seconds()
            self.stats["last_response_time"] = response_time
            self.last_ping_time = datetime.now()

            logger.info(
                f"Tool {key} call completed via queue in {response_time:.3f}s on server {self.mcp_server.id}"
            )
            return result

        except Exception as e:
            self.stats["errors"] += 1
            self.connection_errors["count"] += 1
            self.connection_errors["last_error"] = str(e)
            logger.critical(
                f"Error calling tool {key} on server {self.mcp_server.id}: {e}"
            )
            return []

    def mount(self, app: FastMCP) -> None:
        """
        Mount this MCP server to the main FastMCP app.

        Args:
            app: The FastMCP app to mount to
        """
        logger.info(
            f"Mounting MCP server {self.mcp_server.id} at path {self.mcp_server.mount_path}"
        )
        app.mount(self.mcp_server.id, self)

    async def refresh_configuration(self, updated_server: MCPServer) -> bool:
        """
        Refresh the proxy's configuration with an updated MCP server instance.
        This method handles updates to the server configuration without requiring a full restart.

        Args:
            updated_server: The updated MCP server instance

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            logger.info(f"Refreshing configuration for MCP server {self.mcp_server.id}")

            # Store old state
            old_state = self.state
            prev_state = self.state
            self.state = "restarting"
            logger.info(
                f"State transition: {prev_state} → {self.state} for server {self.mcp_server.id}"
            )

            # Check if critical configuration has changed
            needs_restart = (
                self.mcp_server.run != updated_server.run
                or self.mcp_server.secrets != updated_server.secrets
                or self.mcp_server.settings != updated_server.settings
            )

            # Update the server reference
            self.mcp_server = updated_server

            if needs_restart:
                logger.info(
                    f"Critical configuration changed for server {self.mcp_server.id}, requiring restart"
                )
                # If critical config changed, we need to restart the client
                if self.client_initialized:
                    await self.shutdown()
                await self.initialize()
            else:
                # For non-critical updates, just update the state
                prev_state = self.state
                self.state = old_state
                logger.info(
                    f"State transition: {prev_state} → {self.state} for server {self.mcp_server.id}"
                )
                logger.info(
                    f"Non-critical update applied for server {self.mcp_server.id}, no restart needed"
                )

            logger.info(
                f"Successfully refreshed configuration for server {self.mcp_server.id}"
            )
            return True

        except Exception as e:
            prev_state = self.state
            self.state = "error"
            logger.critical(
                f"State transition: {prev_state} → {self.state} for server {self.mcp_server.id} due to error: {str(e)}"
            )
            self.connection_errors["count"] += 1
            self.connection_errors["last_error"] = str(e)
            logger.error(
                f"Error refreshing configuration for server {self.mcp_server.id}: {e}"
            )
            return False

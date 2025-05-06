from datetime import datetime
from typing import Any, Literal

import mcp.types
from fastapi import FastAPI
from fastmcp.client import Client
from fastmcp.client.transports import StdioTransport
from fastmcp.server.proxy import FastMCPProxy
from fastmcp.tools.tool import Tool
from mcp.server.sse import SseServerTransport
from mcp.shared.exceptions import McpError
from mcp.types import (
    METHOD_NOT_FOUND,
)
from starlette.requests import Request
from starlette.responses import Response

from app.core.logger import get_logger
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
        self.transports: dict[str, SseServerTransport] = {}
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
        logger.info(f"Initializing MCP proxy for server {self.mcp_server.secrets}")
        print(
            {
                **(self.mcp_server.secrets or {}),
                **(self.mcp_server.run.env or {}),
            },
        )
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

    async def initialize(self) -> bool:
        """
        Initialize the client connection asynchronously.

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if not self.client_initialized:
                self.state = "initializing"
                await self.client.__aenter__()
                self.client_initialized = True
                self.state = "running"
                self.last_ping_time = datetime.now()
                logger.info(
                    f"Successfully initialized MCP proxy for server {self.mcp_server.id}"
                )
                return True
            return True
        except Exception as e:
            self.state = "error"
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
            self.state = "stopping"
            if self.client_initialized:
                logger.info(f"Shutting down MCP proxy for server {self.mcp_server.id}")
                try:
                    # Close any active transports first
                    self.transports.clear()
                    # Create a new task in the same event loop
                    await self.client.__aexit__(None, None, None)
                    async with self.client:
                        pass
                except Exception as e:
                    logger.error(f"Error during client cleanup: {e}")
                finally:
                    self.client_initialized = False

            self.state = "stopped"
            logger.info(
                f"Successfully shut down MCP proxy for server {self.mcp_server.id}"
            )
            return True
        except Exception as e:
            self.state = "error"
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
            client_tools = await self.client.list_tools()
        except McpError as e:
            if e.error.code == METHOD_NOT_FOUND:
                client_tools = []
            else:
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

        return tools

    async def _mcp_call_tool(self, key: str, arguments: dict[str, Any]) -> Any:
        """Call a tool with the given arguments, respecting MCP server tool configuration."""
        try:
            # Check if tool is configured and enabled in MCP server
            server_tools = {tool.name: tool for tool in (self.mcp_server.tools or [])}
            if key in server_tools and not server_tools[key].status:
                raise McpError(
                    error=mcp.types.Error(
                        code="TOOL_DISABLED",
                        message=f"Tool {key} is disabled in MCP server configuration",
                    )
                )

            # Execute tool call
            logger.info(f"Calling tool {key} with arguments {arguments}")
            self.stats["requests"] += 1
            start_time = datetime.now()

            if not self.client.is_connected():
                return []

            result = await self.client.call_tool(key, arguments)
            self.stats["last_response_time"] = (
                datetime.now() - start_time
            ).total_seconds()
            self.last_ping_time = datetime.now()

            return result

        except Exception as e:
            self.stats["errors"] += 1
            self.connection_errors["count"] += 1
            self.connection_errors["last_error"] = str(e)
            logger.error(f"Error calling tool {key}: {e}")
            return []

    def mount(self, app: FastAPI) -> None:
        """
        Mount this MCP server to the FastAPI app with dynamic path parameters.

        Args:
            app: The FastAPI app to mount to
        """

        # Define MCP connection handler with path parameters
        @app.get(self.mcp_server.mount_path)
        async def handle_mcp_connection(
            request: Request,
        ):
            transport_key = self.get_transport_key()
            if transport_key not in self.transports:
                logger.info(
                    f"Creating transport and adding to transports for {self.mcp_server.id}"
                )
                self.transports[transport_key] = SseServerTransport(
                    f"{self.mcp_server.mount_path}/messages/"
                )
            transport = self.transports[transport_key]
            async with transport.connect_sse(
                request.scope, request.receive, request._send
            ) as streams:
                await self._mcp_server.run(
                    streams[0],
                    streams[1],
                    self._mcp_server.create_initialization_options(
                        experimental_capabilities={
                            "tool_filtering": {"name": self.tool_group}
                        }
                    ),
                )

        # Handle POST messages with path parameters
        @app.post(f"{self.mcp_server.mount_path}/messages/")
        async def handle_post_message(
            request: Request,
        ) -> Response:
            transport_key = self.get_transport_key()
            transport = self.transports.get(transport_key)
            if not transport:
                return Response(
                    status_code=404,
                    content=f"No active transport for {self.mcp_server.id}",
                )

            return await transport.handle_post_message(
                request.scope, request.receive, request._send
            )

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
            # Store old state
            old_state = self.state
            self.state = "restarting"

            # Check if critical configuration has changed
            needs_restart = (
                self.mcp_server.run != updated_server.run
                or self.mcp_server.secrets != updated_server.secrets
                or self.mcp_server.settings != updated_server.settings
            )

            # Update the server reference
            self.mcp_server = updated_server

            if needs_restart:
                # If critical config changed, we need to restart the client
                if self.client_initialized:
                    await self.shutdown()
                await self.initialize()
            else:
                # For non-critical updates, just update the state
                self.state = old_state

            logger.info(
                f"Successfully refreshed configuration for server {self.mcp_server.id}"
            )
            return True

        except Exception as e:
            self.state = "error"
            self.connection_errors["count"] += 1
            self.connection_errors["last_error"] = str(e)
            logger.error(
                f"Error refreshing configuration for server {self.mcp_server.id}: {e}"
            )
            return False

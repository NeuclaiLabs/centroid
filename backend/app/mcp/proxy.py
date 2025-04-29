from typing import Any

import mcp.types
from fastapi import FastAPI, Path
from fastmcp.client import Client
from fastmcp.client.transports import StdioTransport
from fastmcp.server.proxy import FastMCPProxy
from fastmcp.tools.tool import Tool
from fastmcp.utilities.func_metadata import func_metadata
from mcp.server.sse import SseServerTransport
from mcp.shared.exceptions import McpError
from mcp.types import (
    METHOD_NOT_FOUND,
    EmbeddedResource,
    ImageContent,
    TextContent,
)
from starlette.requests import Request
from starlette.responses import Response

from app.core.logger import get_logger
from app.models.mcp_server import MCPServer as MCPServerConfig

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
            fn_metadata=func_metadata(_proxy_passthrough),
            is_async=True,
        )


class MCPProxy(FastMCPProxy):
    def __init__(
        self,
        mcp_server: MCPServerConfig,
        mount_path: str = "/mcp",
        **kwargs,
    ):
        self.mcp_server = mcp_server
        self.base_path = mount_path
        self.mount_path = f"{mount_path}/{{tool_group}}/servers/{{server_type}}"
        self.messages_path = f"{self.mount_path}/messages/"
        self.transports: dict[str, SseServerTransport] = {}
        self.client_initialized = False
        print("Creating client...")
        self.client = Client(
            transport=StdioTransport(
                command=mcp_server.run.command,
                cwd=mcp_server.run.cwd,
                env=mcp_server.run.env,
                args=mcp_server.run.args,
            ),
        )
        super().__init__(self.client, **kwargs)

    async def initialize(self) -> None:
        """Initialize the client connection asynchronously."""
        if not self.client_initialized:
            await self.client.__aenter__()
            self.client_initialized = True

    async def cleanup(self) -> None:
        """Clean up the client connection asynchronously."""
        if self.client_initialized:
            await self.client.__aexit__(None, None, None)
            self.client_initialized = False

    def get_transport_key(self, tool_group: str, server_type: str) -> str:
        """Get a unique key for storing transports."""
        return f"{tool_group}:{server_type}"

    async def get_tools(self) -> dict[str, Tool]:
        tools = await super().get_tools()

        try:
            client_tools = await self.client.list_tools()
        except McpError as e:
            if e.error.code == METHOD_NOT_FOUND:
                client_tools = []
            else:
                raise e

        for tool in client_tools:
            tool_proxy = await ProxyTool.from_client(self.client, tool)
            tools[tool_proxy.name] = tool_proxy

        return tools

    async def _mcp_call_tool(
        self, key: str, arguments: dict[str, Any]
    ) -> list[TextContent | ImageContent | EmbeddedResource]:
        try:
            result = await self.client.call_tool(key, arguments)
            return result
        except Exception as e:
            print("Error: ", e)
            return []

    def mount(self, app: FastAPI) -> None:
        """
        Mount this MCP server to the FastAPI app with dynamic path parameters.

        Args:
            app: The FastAPI app to mount to
        """

        # Define MCP connection handler with path parameters
        @app.get(self.mount_path)
        async def handle_mcp_connection(
            request: Request,
            tool_group: str = Path(..., description="Tool group name"),
            server_type: str = Path(
                ..., description="Server type (e.g. github, gitlab)"
            ),
        ):
            transport_key = self.get_transport_key(tool_group, server_type)
            if transport_key not in self.transports:
                print("Creating transport and adding to transports")
                self.transports[transport_key] = SseServerTransport(
                    f"{self.base_path}/{tool_group}/servers/{server_type}/messages/"
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
                            "tool_filtering": {"name": tool_group}
                        }
                    ),
                )

        # Handle POST messages with path parameters
        @app.post(self.messages_path)
        async def handle_post_message(
            request: Request,
            tool_group: str = Path(..., description="Tool group name"),
            server_type: str = Path(
                ..., description="Server type (e.g. github, gitlab)"
            ),
        ) -> Response:
            transport_key = self.get_transport_key(tool_group, server_type)
            transport = self.transports.get(transport_key)
            if not transport:
                return Response(
                    status_code=404,
                    content=f"No active transport for {tool_group}/{server_type}",
                )

            return await transport.handle_post_message(
                request.scope, request.receive, request._send
            )

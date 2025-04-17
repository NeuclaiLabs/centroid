from collections.abc import Callable
from typing import Any, Literal

from fastapi import FastAPI
from mcp.server.fastmcp import FastMCP as FastMCPServer
from mcp.server.sse import SseServerTransport
from pydantic import BaseModel, Field
from sqlmodel import Session, select
from starlette.requests import Request

from app.mcp.openapi.schema_to_func import schema_to_function
from app.models.tool_instance import ToolInstance, ToolInstanceStatus


class MCPServerConfig(BaseModel):
    """Configuration for an MCP server instance."""

    id: str = Field(description="Unique identifier for the MCP server")
    name: str = Field(description="Name of the MCP server")
    kind: Literal["external", "openapi", "fastmcp"] = Field(
        default="external", description="Kind of MCP server"
    )
    description: str = Field(default="", description="Description of the MCP server")
    base_url: str | None = Field(
        default=None, description="Base URL for the MCP server"
    )
    mount_path: str = Field(description="Path where the MCP server will be mounted")
    metadata: dict[str, Any] = Field(
        default_factory=dict, description="Additional metadata for the MCP server"
    )
    tool_collection: str | None = Field(
        default=None, description="Collection of tools associated with this server"
    )


class ToolConfig(BaseModel):
    """Configuration for a tool instance."""

    name: str = Field(description="Name of the tool")
    description: str = Field(default="", description="Description of the tool")
    function: Callable = Field(description="The tool function to register")


class MCPServer:
    """
    A wrapper class for MCP server that handles tool registration and deregistration.
    This class simplifies the interaction with the MCP server and tools.
    """

    def __init__(self, db: Session, config: MCPServerConfig):
        """
        Initialize a new MCP server with the given configuration.

        Args:
            db: The database session
            config: The configuration for the MCP server
        """
        self.config = config
        self._tools: dict[str, ToolInstance] = {}  # Maps tool name to ToolInstance

        # Create the underlying FastMCP server
        self.server = FastMCPServer(name=config.name)

        # Create the transport
        self.transport = SseServerTransport(f"{config.mount_path}/messages/")
        self.db = db
        self.load_tools()

    def create_tools(self) -> None:
        """Create tools from the database and register them with the server."""
        pass

    def register_tool(self, tool_instance: ToolInstance) -> None:
        """
        Register a tool with this MCP server.

        Args:
            tool_instance: The ToolInstance to register
        """
        if tool_instance.tool_schema is None:
            raise ValueError("Tool instance must have a schema")

        tool_name = tool_instance.tool_schema.get("name")
        if not tool_name:
            raise ValueError("Tool schema must have a name")

        if tool_name in self._tools:
            raise ValueError(f"Tool with name '{tool_name}' already exists")

        # Create a function from the tool schema
        tool_function = schema_to_function(
            tool_instance.tool_schema,
            tool_instance.tool_metadata or {},
            tool_instance.config or {},
        )

        # Register the tool with the MCP server
        self.server.tool()(tool_function)

        # Store tool instance
        self._tools[tool_name] = tool_instance

    def deregister_tool(self, tool_name: str) -> None:
        """
        Deregister a tool from this MCP server.

        Args:
            tool_name: The name of the tool to deregister
        """
        if tool_name not in self._tools:
            raise ValueError(f"Tool with name '{tool_name}' not found")

        # Deregister the tool from the MCP server
        if tool_name in self.server._tool_manager._tools:
            del self.server._tool_manager._tools[tool_name]

        # Remove tool instance
        del self._tools[tool_name]

    def get_tool(self, tool_name: str) -> ToolInstance | None:
        """
        Get tool instance by name.

        Args:
            tool_name: The name of the tool

        Returns:
            The tool instance or None if not found
        """
        return self._tools.get(tool_name)

    def get_all_tools(self) -> list[ToolInstance]:
        """
        Get all tools registered with this server.

        Returns:
            List of tool instances
        """
        return list(self._tools.values())

    def mount(self, app: FastAPI) -> None:
        """
        Mount this MCP server to the FastAPI app.

        Args:
            app: The FastAPI app to mount to
        """

        # Define MCP connection handler
        async def handle_mcp_connection(request: Request):
            async with self.transport.connect_sse(
                request.scope, request.receive, request._send
            ) as streams:
                await self.server._mcp_server.run(
                    streams[0],
                    streams[1],
                    self.server._mcp_server.create_initialization_options(),
                )

        # Mount the MCP connection handler
        app.get(self.config.mount_path)(handle_mcp_connection)
        app.mount(
            f"{self.config.mount_path}/messages/",
            app=self.transport.handle_post_message,
        )

    def load_tools(self) -> None:
        """Load tools from the database and register them with the server."""
        with self.db as session:
            # Query for tool instances associated with this MCP server
            stmt = select(ToolInstance).where(
                ToolInstance.mcp_instance_id == self.config.id,
                ToolInstance.status == ToolInstanceStatus.ACTIVE,
            )
            tool_instances = session.exec(stmt).all()

            # Clear existing tools before loading new ones
            self._tools = {}
            if hasattr(self.server, "_tool_manager") and hasattr(
                self.server._tool_manager, "_tools"
            ):
                self.server._tool_manager._tools = {}

            # Register each tool instance
            for tool_instance in tool_instances:
                try:
                    self.register_tool(tool_instance)
                except ValueError as e:
                    # Log error but continue loading other tools
                    print(f"Error loading tool {tool_instance.id}: {e}")

    def handle_status_change(
        self, tool_instance: ToolInstance, old_status: ToolInstanceStatus | None
    ) -> None:
        """
        Handle tool registration/deregistration when status changes.

        Args:
            tool_instance: The tool instance whose status changed
            old_status: The previous status of the tool instance (None for new instances)
        """
        tool_name = (
            tool_instance.tool_schema.get("name") if tool_instance.tool_schema else None
        )
        if not tool_name:
            return

        is_new_instance = old_status is None
        is_status_change = not is_new_instance and old_status != tool_instance.status

        # For new instances, register only if active
        if is_new_instance:
            if tool_instance.status == ToolInstanceStatus.ACTIVE:
                self.register_tool(tool_instance)
            return

        # For existing instances, handle status changes
        if is_status_change:
            if tool_instance.status == ToolInstanceStatus.ACTIVE:
                # Only register if not already registered
                if tool_name not in self._tools:
                    self.register_tool(tool_instance)
            elif tool_instance.status == ToolInstanceStatus.INACTIVE:
                # Only deregister if currently registered
                if tool_name in self._tools:
                    self.deregister_tool(tool_name)

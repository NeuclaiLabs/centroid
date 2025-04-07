from collections.abc import Callable

from mcp.server.fastmcp import FastMCP
from pydantic import Field
from sqlmodel import Session

from app.core.db import engine

mcp = FastMCP("OpenAstra - MCP gateway for third party APIs")


@mcp.resource("echo://{message}")
def echo_resource(message: str) -> str:
    """Echo a message as a resource"""
    return f"Resource echo: {message}"


@mcp.tool()
def echo_tool(
    message: str,
    message2=Field(default=None, description="Optional title", title="Optional title"),
) -> str:
    """Echo a message as a tool"""
    return f"Tool echo: {message} {message2}"


@mcp.tool()
def greet(
    name: str = Field(description="The name to greet"),
    title: str = Field(description="Optional title", default=""),
) -> str:
    """A greeting tool"""
    return f"Hello {title} {name}"


# Define example tools WITHOUT decorators - these will be loaded dynamically
def addition_tool(a: int, b=None) -> int:
    """Add two numbers together"""
    # Handle the None case
    if b is None:
        return a
    return a + b


# Register dynamic tools at startup
# This ensures tools are available when the MCP client connects
tools_to_load = [
    addition_tool,
    # schema_to_function(github_schema["tool_schema"], github_schema["tool_metadata"]),
]

for func in tools_to_load:
    decorated_func = mcp.tool()(func)
    print(f"Loaded tool at startup: {func.__name__}")


# For more advanced dynamic loading (if needed later)
def register_tool(func: Callable) -> Callable:
    """Register a function as a tool at runtime"""
    decorated_func = mcp.tool()(func)
    print(f"Dynamically registered tool: {func.__name__}")
    return decorated_func


# Add async function to delete tool after delay
def deregister_tool(tool_name: str) -> None:
    """Delete a tool after specified delay in seconds"""
    if tool_name in mcp._tool_manager._tools:
        del mcp._tool_manager._tools[tool_name]
        print(f"Deleted tool: {tool_name}")


# Function to load active tool instances
def load_active_tool_instances() -> None:
    """Load and register all active tool instances from the database."""
    try:
        with Session(engine) as session:
            # Import here to avoid circular imports
            from app.services.tool_registration import ToolRegistrationService

            print("Loading active tool instances from database...")
            ToolRegistrationService.load_active_tool_instances(session)
    except ImportError as e:
        print(f"Warning: Could not load active tool instances: {e}")
    except Exception as e:
        print(f"Error loading active tool instances: {e}")


# Load active tool instances when this module is imported
load_active_tool_instances()

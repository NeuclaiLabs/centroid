import asyncio
from collections.abc import Callable
from typing import Literal

from mcp.server.fastmcp import FastMCP
from pydantic import Field

from app.mcp.openapi.schema_to_func import create_dynamic_function_from_schema

# Type for HTTP methods
HttpMethod = Literal["GET", "POST", "PUT", "PATCH", "DELETE"]

github_schema = {
    "title": "get_github_issues",
    "description": "Parameters for fetching GitHub issues via REST API",
    "type": "object",
    "properties": {
        "owner": {
            "type": "string",
            "description": "The account owner of the repository",
            "x-category": "parameters",
        },
        "repo": {
            "type": "string",
            "description": "The name of the repository",
            "x-category": "parameters",
        },
        "state": {
            "type": "string",
            "enum": ["open", "closed", "all"],
            "default": "open",
            "description": "Indicates the state of issues to return",
            "x-category": "parameters",
        },
    },
    "required": ["owner", "repo"],
}


mcp = FastMCP("OpenAstra - MCP gateway for third party APIs")


@mcp.resource("echo://{message}")
def echo_resource(message: str) -> str:
    """Echo a message as a resource"""
    return f"Resource echo: {message}"


@mcp.tool()
def echo_tool(message: str) -> str:
    """Echo a message as a tool"""
    return f"Tool echo: {message}"


@mcp.tool()
def greet(
    name: str = Field(description="The name to greet"),
    title: str = Field(description="Optional title", default=""),
) -> str:
    """A greeting tool"""
    return f"Hello {title} {name}"


@mcp.prompt()
def echo_prompt(message: str) -> str:
    """Create an echo prompt"""
    return f"Please process this message: {message}"


# Define example tools WITHOUT decorators - these will be loaded dynamically
def addition_tool(a: int, b: int) -> int:
    """Add two numbers together"""
    return a + b


def concatenate_tool(text1: str, text2: str) -> str:
    """Concatenate two strings"""
    return f"{text1} {text2}"


# Register dynamic tools at startup
# This ensures tools are available when the MCP client connects
tools_to_load = [
    addition_tool,
    concatenate_tool,
    create_dynamic_function_from_schema(github_schema),
]

for func in tools_to_load:
    decorated_func = mcp.tool()(func)
    print(f"Loaded tool at startup: {func.__name__}")


# For more advanced dynamic loading (if needed later)
def register_dynamic_tool(func: Callable) -> Callable:
    """Register a function as a tool at runtime"""
    decorated_func = mcp.tool()(func)
    print(f"Dynamically registered tool: {func.__name__}")
    return decorated_func


# Add async function to delete tool after delay
async def delete_tool_after_delay(tool_name: str, delay: float) -> None:
    """Delete a tool after specified delay in seconds"""
    await asyncio.sleep(delay)
    if tool_name in mcp._tool_manager._tools:
        del mcp._tool_manager._tools[tool_name]
        print(f"Deleted tool: {tool_name}")


# Schedule tool deletion
# asyncio.create_task(delete_tool_after_delay("concatenate_tool", 10.0))

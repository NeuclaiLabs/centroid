import asyncio
from collections.abc import Callable

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("OpenAstra - MCP gateway for third party APIs")


@mcp.resource("echo://{message}")
def echo_resource(message: str) -> str:
    """Echo a message as a resource"""
    return f"Resource echo: {message}"


@mcp.tool()
def echo_tool(message: str) -> str:
    """Echo a message as a tool"""
    return f"Tool echo: {message}"


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
tools_to_load = [addition_tool, concatenate_tool]

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
asyncio.create_task(delete_tool_after_delay("concatenate_tool", 10.0))

print(mcp._tool_manager._tools)

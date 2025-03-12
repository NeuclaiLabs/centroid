import warnings

import sentry_sdk
from fastapi import FastAPI
from mcp.server.fastmcp import FastMCP
from mcp.server.sse import SseServerTransport
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request

from app.api.main import LoggingMiddleware, api_router
from app.core.config import settings
from app.mcp.server import mcp

# Suppress specific Pydantic warnings
warnings.filterwarnings(
    "ignore", message="Pydantic serializer warnings:", category=UserWarning
)


def mount_mcp_server(
    app: FastAPI,
    mcp_server: FastMCP,
    mount_path: str = "/mcp",
) -> None:
    # Create SSE transport for MCP messages
    sse_transport = SseServerTransport(f"{mount_path}/messages/")

    # Define MCP connection handler
    async def handle_mcp_connection(request: Request):
        async with sse_transport.connect_sse(
            request.scope, request.receive, request._send
        ) as streams:
            await mcp_server._mcp_server.run(
                streams[0],
                streams[1],
                mcp_server._mcp_server.create_initialization_options(),
            )

    # Mount the MCP connection handler
    app.get(mount_path)(handle_mcp_connection)
    app.mount(f"{mount_path}/messages/", app=sse_transport.handle_post_message)


if settings.SENTRY_DSN:
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.add_middleware(LoggingMiddleware)
app.include_router(api_router, prefix=settings.API_V1_STR)

# Add MCP server to the FastAPI app
mount_mcp_server(app, mcp)

# Run the server if this file is executed directly
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,  # Enable auto-reload on file changes
    )

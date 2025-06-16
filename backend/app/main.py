import asyncio
import contextlib
import logging
import warnings
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastmcp import FastMCP
from sqlmodel import Session, select

from app.api.main import api_router
from app.core.config import settings
from app.core.db import engine
from app.mcp.manager import MCPManager
from app.models import MCPServer, MCPServerStatus

# Suppress specific Pydantic warnings
warnings.filterwarnings(
    "ignore", message="Pydantic serializer warnings:", category=UserWarning
)

if settings.SENTRY_DSN:
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

logger = logging.getLogger(__name__)


def combine_lifespans(*lifespans):
    """Create a combined lifespan to manage multiple session managers"""

    @contextlib.asynccontextmanager
    async def combined_lifespan(app):
        async with contextlib.AsyncExitStack() as stack:
            for lifespan in lifespans:
                await stack.enter_async_context(lifespan(app))
            yield

    return combined_lifespan


# Create your FastMCP server as well as any tools, resources, etc.
mcp = FastMCP("MCP Servers")
agent = FastMCP("Agents")
# Create the ASGI app
mcp_app = mcp.http_app(path="/mcp")
agent_app = agent.http_app(path="/agent")


# Define the function that will be used for the lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    # Create a new session and start active MCP servers
    with Session(engine) as session:
        # Query active servers
        query = select(MCPServer).where(MCPServer.status == MCPServerStatus.ACTIVE)
        active_servers = session.exec(query).all()
        active_servers = [MCPServer.model_validate(server) for server in active_servers]
        logger.info(f"Starting {len(active_servers)} active MCP servers")
        # Get the MCP manager singleton
        manager = MCPManager()
        manager.set_session(session)
        manager.set_mcp_app(mcp)
        manager.set_agent_app(agent)
        logger.info(f"Manager: {manager}")

        # Initialize the manager with active servers in the background
        asyncio.create_task(manager.initialize(active_servers))
        logger.info("Server initialization started in background")

    yield  # This is where FastAPI serves requests

    # Stop all servers on shutdown
    logger.info("Stopping all MCP servers")

    # Get the manager singleton to stop servers
    manager = MCPManager.get_singleton()

    # Use the manager's shutdown method to stop all servers in parallel
    await manager.shutdown()


# Combine both lifespans
combined_lifespan = combine_lifespans(mcp_app.lifespan, agent_app.lifespan, lifespan)
# Update the FastAPI app initialization to use the lifespan
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=combine_lifespans(mcp_app.lifespan, lifespan),
)


# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)
app.mount("/mcp-server", mcp_app)
app.mount("/agent", agent_app)

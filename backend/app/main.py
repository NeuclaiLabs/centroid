import logging
import warnings
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.api.main import LoggingMiddleware, api_router
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


# Define the function that will be used for the lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    # Create a new session and start active MCP servers
    with Session(engine) as session:
        # Query active servers
        query = select(MCPServer).where(MCPServer.status == MCPServerStatus.ACTIVE)
        active_servers = session.exec(query).all()
        active_servers = [MCPServer.model_validate(server) for server in active_servers]
        print(f"Starting {len(active_servers)} active MCP servers")
        logger.info(f"Starting {len(active_servers)} active MCP servers")
        # Get the MCP manager singleton
        manager = MCPManager()
        manager.set_app(app)
        logger.info(f"Manager: {manager}")
        # Initialize the manager with active servers
        await manager.initialize(active_servers)
        logger.info(f"Manager initialized with {len(active_servers)} active servers")
        # proxy = MCPProxy(
        #     MCPServer(
        #         id="github_direct",
        #         name="github",
        #         description="GitHub MCP server",
        #         secrets={},
        #         run=MCPServerRunConfig(
        #             command="docker",
        #             args=[
        #                 "run",
        #                 "--rm",
        #                 "-i",
        #                 "-e",
        #                 "GITHUB_PERSONAL_ACCESS_TOKEN",
        #                 "ghcr.io/github/github-mcp-server",
        #             ],
        #             env={
        #                 "GITHUB_PERSONAL_ACCESS_TOKEN": "xxxx"
        #             },
        #         ),
        #     ),
        # )
        # proxy.mount(app)
        # await proxy.initialize()

    yield  # This is where FastAPI serves requests

    # Stop all servers on shutdown
    logger.info("Stopping all MCP servers")

    # Get the manager singleton to stop servers
    manager = MCPManager.get_singleton()

    # Use the manager's shutdown method to stop all servers in parallel
    await manager.shutdown()


# Update the FastAPI app initialization to use the lifespan
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LoggingMiddleware)
app.include_router(api_router, prefix=settings.API_V1_STR)

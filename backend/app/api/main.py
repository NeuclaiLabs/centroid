import uuid

from fastapi import APIRouter

from app.analytics import AnalyticsService
from app.api.routes import (
    chats,
    documents,
    files,
    items,
    llm,
    login,
    logs,
    messages,
    projects,
    secrets,
    streams,
    suggestions,
    teams,
    users,
    utils,
    votes,
)
from app.api.routes.mcp import servers, templates
from app.core.logger import get_logger

# Initialize analytics service and generate instance ID
analytics_service = AnalyticsService()
INSTANCE_ID = str(uuid.uuid4())  # Generate once at startup

# Setup logger using custom logger
logger = get_logger(__name__)

api_router = APIRouter()


# Include all routers
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(chats.router, prefix="/chats", tags=["chats"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(
    suggestions.router, prefix="/suggestions", tags=["suggestions"]
)
api_router.include_router(votes.router, prefix="/votes", tags=["votes"])
api_router.include_router(teams.router, prefix="/teams", tags=["teams"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(llm.router, prefix="/llm", tags=["llm"])
api_router.include_router(logs.router, prefix="/logs", tags=["logs"])
api_router.include_router(secrets.router, prefix="/secrets", tags=["secrets"])
api_router.include_router(streams.router, prefix="/streams", tags=["streams"])


api_router.include_router(
    servers.router, prefix="/mcp/servers", tags=["mcp", "servers"]
)
api_router.include_router(
    templates.router, prefix="/mcp/templates", tags=["mcp", "templates"]
)

from fastapi import APIRouter

from app.api.routes import chats, items, login, settings, tool_calls, users, utils

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(chats.router, prefix="/chats", tags=["chats"])
api_router.include_router(tool_calls.router, prefix="/tool-calls", tags=["tool-calls"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])

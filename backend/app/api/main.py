from fastapi import APIRouter

from app.api.routes import actions, chats, items, login, settings, users, utils

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(chats.router, prefix="/chats", tags=["chats"])
api_router.include_router(actions.router, prefix="/actions", tags=["actions"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])

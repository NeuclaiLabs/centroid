import warnings

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.main import LoggingMiddleware, api_router
from app.core.config import settings

# Suppress specific Pydantic warnings
warnings.filterwarnings(
    "ignore", message="Pydantic serializer warnings:", category=UserWarning
)

if settings.SENTRY_DSN:
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
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


# @app.on_event("startup")
# async def startup_event():
#     from sqlmodel import Session

#     # Use the same session approach as in deps.py
#     with Session(engine) as session:
#         manager = MCPManager.get_instance()
#         await manager.initialize(session)

#         # Start health checks
#         MCPManager.schedule_health_checks(BackgroundTasks())


# Run the server if this file is executed directly
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,  # Enable auto-reload on file changes
    )

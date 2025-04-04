import asyncio
import logging

from sqlmodel import Session, select

from app.core.db import engine, get_tool_files, init_db, populate_tool_definitions
from app.models import (  # Adjust import based on your model structure
    User,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def is_db_empty(session: Session) -> bool:
    # Check if any users exist
    result = session.exec(select(User)).first()
    return result is None


async def init() -> None:
    with Session(engine) as session:
        # Always populate tool definitions on startup
        logger.info("Ensuring tool definitions are up to date...")
        populate_tool_definitions(session, get_tool_files())

        # Initialize other data only if database is empty
        if await is_db_empty(session):
            logger.info("Database is empty, initializing with seed data...")
            await init_db(session)
        else:
            logger.info("Database already contains data, skipping user initialization")


async def main() -> None:
    logger.info("Starting database initialization")
    await init()
    logger.info("Database initialization completed")


if __name__ == "__main__":
    asyncio.run(main())

import asyncio
import logging

from sqlmodel import Session, select

from app.core.db import engine, init_db
from app.models import User  # Adjust import based on your model structure

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def is_db_empty(session: Session) -> bool:
    # Check if any users exist - adjust this based on your needs
    result = session.exec(select(User)).first()
    return result is None


async def init() -> None:
    with Session(engine) as session:
        if await is_db_empty(session):
            logger.info("Database is empty, initializing with seed data...")
            await init_db(session)
        else:
            logger.info("Database already contains data, skipping initialization")


async def main() -> None:
    logger.info("Checking initial data")
    await init()
    logger.info("Initial data check completed")


if __name__ == "__main__":
    asyncio.run(main())

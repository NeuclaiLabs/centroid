import logging

from sqlmodel import Session, select

from app.core.db import engine, init_db
from app.models import User  # Adjust import based on your model structure

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def is_db_empty(session: Session) -> bool:
    # Check if any users exist - adjust this based on your needs
    result = session.exec(select(User)).first()
    return result is None


def init() -> None:
    with Session(engine) as session:
        if is_db_empty(session):
            logger.info("Database is empty, initializing with seed data...")
            init_db(session)
        else:
            logger.info("Database already contains data, skipping initialization")


def main() -> None:
    logger.info("Checking initial data")
    init()
    logger.info("Initial data check completed")


if __name__ == "__main__":
    main()

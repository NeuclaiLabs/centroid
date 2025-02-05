import logging
import time

from sqlalchemy import create_engine

from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

max_tries = 60  # Maximum number of tries
wait_seconds = 1  # Seconds to wait between tries


def wait_for_db() -> None:
    for i in range(max_tries):
        try:
            engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
            engine.connect()
            logger.info("Database is ready!")
            return
        except Exception:
            logger.info(f"Database not ready, waiting... ({i+1}/{max_tries})")
            time.sleep(wait_seconds)
    raise Exception("Could not connect to database")


if __name__ == "__main__":
    wait_for_db()

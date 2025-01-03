import logging

from sqlalchemy import Engine
from sqlmodel import Session, select
from tenacity import before_log, retry, stop_after_attempt, wait_fixed

from app.core.db import engine
from app.core.logger import get_logger

logger = get_logger(__name__, service="startup")

max_tries = 60 * 5  # 5 minutes
wait_seconds = 1


@retry(
    stop=stop_after_attempt(max_tries),
    wait=wait_fixed(wait_seconds),
    before=before_log(logger, logging.INFO),
    after=before_log(logger, logging.WARN),
)
def init(db_engine: Engine) -> None:
    try:
        with Session(db_engine) as session:
            # Try to create session to check if DB is awake
            session.exec(select(1))
    except Exception as e:
        logger.error(
            "Database connection failed",
            extra={"error": str(e), "attempt": max_tries, "wait_seconds": wait_seconds},
            exc_info=True,
        )
        raise e


def main() -> None:
    logger.info(
        "Initializing service", extra={"stage": "startup", "component": "database"}
    )
    init(engine)
    logger.info(
        "Service finished initializing",
        extra={"stage": "startup", "status": "completed"},
    )


if __name__ == "__main__":
    main()

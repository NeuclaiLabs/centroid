import asyncio
from collections.abc import Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.core.db import engine, init_db
from app.main import app
from app.tests.utils.user import authentication_token_from_email
from app.tests.utils.utils import get_superuser_token_headers


@pytest.fixture(scope="session", autouse=True)
def mock_startup_dependencies():
    """Mock dependencies used in startup event."""
    mock_manager = MagicMock()
    mock_manager.initialize = AsyncMock()

    with patch(
        "app.core.security.load_secrets_to_env", return_value=None
    ) as mock_secrets:
        with patch(
            "app.mcp.mcp_manager.MCPManager.get_instance", return_value=mock_manager
        ) as mock_get_instance:
            yield {
                "secrets": mock_secrets,
                "mcp_instance": mock_get_instance,
                "mcp_manager": mock_manager,
            }


@pytest.fixture(scope="session", autouse=True)
def db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        asyncio.run(init_db(session))
        yield session
        # Clean up in reverse order of dependencies
        # statement = delete(ToolInstance)
        # session.execute(statement)
        # statement = delete(Connection)
        # session.execute(statement)
        # statement = delete(Item)
        # session.execute(statement)
        # statement = delete(User)
        # session.execute(statement)
        # session.commit()


@pytest.fixture(autouse=True)
def auto_rollback(db: Session) -> Generator[None, None, None]:
    """Automatically rollback all changes after each test."""
    try:
        yield
    finally:
        db.rollback()


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_superuser_token_headers(client)


@pytest.fixture(scope="module")
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )

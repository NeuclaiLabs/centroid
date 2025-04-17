import asyncio
from unittest.mock import MagicMock, patch

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session, delete

from app.core.config import settings
from app.core.security import get_password_hash
from app.crud import get_user_by_email
from app.models import (
    MCPInstance,
    MCPInstanceStatus,
    User,
)
from app.services.mcp_manager import MCPManager
from app.tests.utils.utils import random_email, random_lower_string


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# Mock the MCPManager singleton
@pytest.fixture(autouse=True)
def mock_mcp_manager():
    async def mock_register(*args, **kwargs):  # noqa: ARG001
        return None

    async def mock_deregister(*args, **kwargs):  # noqa: ARG001
        return None

    with patch.object(MCPManager, "get_instance") as mock_get_instance:
        mock_manager = MagicMock()
        mock_manager._register_instance = mock_register
        mock_manager._deregister_instance = mock_deregister
        mock_get_instance.return_value = mock_manager
        yield mock_manager


# Mock the event listeners and asyncio.create_task
@pytest.fixture(autouse=True)
def mock_event_listeners():
    """Mock event listeners and prevent async task creation."""
    with (
        patch("asyncio.create_task", return_value=None),
        patch("app.models.mcp_instance.handle_instance_creation", return_value=None),
        patch("app.models.mcp_instance.handle_instance_update", return_value=None),
        patch("app.models.mcp_instance.handle_instance_deletion", return_value=None),
        patch(
            "app.services.mcp_manager.MCPManager._register_instance", return_value=None
        ),
        patch(
            "app.services.mcp_manager.MCPManager._deregister_instance",
            return_value=None,
        ),
    ):
        yield


@pytest.fixture(autouse=True)
def cleanup_mcp_instances(db: Session):
    """Clean up MCP instances before each test."""
    statement = delete(MCPInstance)
    db.execute(statement)
    db.commit()
    yield


@pytest.fixture
def mcp_instance_data():
    return {
        "name": "Test MCP Instance",
        "description": "Test Description",
        "status": MCPInstanceStatus.ACTIVE,
        "url": "http://localhost:8000",
        "config": {"key": "value"},
    }


@pytest.fixture
def user(db: Session) -> User:
    """Get the test user."""
    return get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)


@pytest.fixture
def mcp_instance(db: Session, user: User, mcp_instance_data: dict) -> MCPInstance:
    instance = MCPInstance(**mcp_instance_data, owner_id=user.id)
    db.add(instance)
    db.commit()
    db.refresh(instance)
    return instance


def test_create_mcp_instance(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    mcp_instance_data: dict,
):
    response = client.post(
        f"{settings.API_V1_STR}/mcp-instances/",
        headers=normal_user_token_headers,
        json=mcp_instance_data,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == mcp_instance_data["name"]
    assert data["description"] == mcp_instance_data["description"]
    assert data["status"] == mcp_instance_data["status"]
    assert data["url"] == mcp_instance_data["url"]
    assert data["config"] == mcp_instance_data["config"]
    assert "id" in data
    assert "createdAt" in data
    assert "updatedAt" in data
    assert "ownerId" in data


def test_create_mcp_instance_unauthorized(
    client: TestClient,
    mcp_instance_data: dict,
):
    response = client.post(
        f"{settings.API_V1_STR}/mcp-instances/",
        json=mcp_instance_data,
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_read_mcp_instances(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    mcp_instance: MCPInstance,
):
    response = client.get(
        f"{settings.API_V1_STR}/mcp-instances/",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["data"]) == 1
    assert data["count"] == 1
    assert data["data"][0]["id"] == mcp_instance.id


def test_read_mcp_instances_with_pagination(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    session: Session,
    mcp_instance_data: dict,
    user: User,
):
    # Create multiple instances
    for i in range(15):
        instance = MCPInstance(
            **mcp_instance_data,
            name=f"Instance {i}",
            owner_id=user.id,
        )
        session.add(instance)
    session.commit()

    # Test first page
    response = client.get(
        f"{settings.API_V1_STR}/mcp-instances/?limit=10&skip=0",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["data"]) == 10
    assert data["count"] == 15

    # Test second page
    response = client.get(
        f"{settings.API_V1_STR}/mcp-instances/?limit=10&skip=10",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["data"]) == 5
    assert data["count"] == 15


def test_read_mcp_instance(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    mcp_instance: MCPInstance,
):
    response = client.get(
        f"{settings.API_V1_STR}/mcp-instances/{mcp_instance.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == mcp_instance.id
    assert data["name"] == mcp_instance.name
    assert data["description"] == mcp_instance.description
    assert data["status"] == mcp_instance.status
    assert data["url"] == mcp_instance.url
    assert data["config"] == mcp_instance.config
    assert data["ownerId"] == mcp_instance.owner_id


def test_read_mcp_instance_not_found(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
):
    response = client.get(
        f"{settings.API_V1_STR}/mcp-instances/nonexistent-id",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "MCP instance not found"


def test_read_mcp_instance_unauthorized(
    client: TestClient,
    mcp_instance: MCPInstance,
):
    response = client.get(
        f"{settings.API_V1_STR}/mcp-instances/{mcp_instance.id}",
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_update_mcp_instance(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    mcp_instance: MCPInstance,
):
    update_data = {
        "name": "Updated Name",
        "description": "Updated Description",
        "status": MCPInstanceStatus.INACTIVE,
        "url": "http://localhost:8001",
        "config": {"updated": "value"},
    }
    response = client.put(
        f"{settings.API_V1_STR}/mcp-instances/{mcp_instance.id}",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["description"] == update_data["description"]
    assert data["status"] == update_data["status"]
    assert data["url"] == update_data["url"]
    assert data["config"] == update_data["config"]


def test_update_mcp_instance_partial(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    mcp_instance: MCPInstance,
):
    update_data = {"name": "Only Name Updated"}
    response = client.put(
        f"{settings.API_V1_STR}/mcp-instances/{mcp_instance.id}",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["description"] == mcp_instance.description
    assert data["status"] == mcp_instance.status
    assert data["url"] == mcp_instance.url
    assert data["config"] == mcp_instance.config


def test_update_mcp_instance_not_found(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
):
    update_data = {"name": "Updated Name"}
    response = client.put(
        f"{settings.API_V1_STR}/mcp-instances/nonexistent-id",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "MCP instance not found"


def test_update_mcp_instance_unauthorized(
    client: TestClient,
    mcp_instance: MCPInstance,
):
    update_data = {"name": "Updated Name"}
    response = client.put(
        f"{settings.API_V1_STR}/mcp-instances/{mcp_instance.id}",
        json=update_data,
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_delete_mcp_instance(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    mcp_instance: MCPInstance,
):
    response = client.delete(
        f"{settings.API_V1_STR}/mcp-instances/{mcp_instance.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == "MCP instance deleted successfully"

    # Verify instance is deleted
    response = client.get(
        f"{settings.API_V1_STR}/mcp-instances/{mcp_instance.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "MCP instance not found"


def test_delete_mcp_instance_not_found(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
):
    response = client.delete(
        f"{settings.API_V1_STR}/mcp-instances/nonexistent-id",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "MCP instance not found"


def test_delete_mcp_instance_unauthorized(
    client: TestClient,
    mcp_instance: MCPInstance,
):
    response = client.delete(
        f"{settings.API_V1_STR}/mcp-instances/{mcp_instance.id}",
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_mcp_instance_owner_access(
    client: TestClient,
    db: Session,
    mcp_instance: MCPInstance,
):
    # Create a different user with random email
    other_email = random_email()
    other_password = random_lower_string()
    other_user = User(
        email=other_email,
        hashed_password=get_password_hash(other_password),
        full_name="Other Test User",
        is_active=True,
    )
    db.add(other_user)
    db.commit()
    db.refresh(other_user)

    # Get token for other user
    login_data = {
        "username": other_email,
        "password": other_password,
    }
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    tokens = r.json()
    other_user_token = tokens["access_token"]
    other_user_headers = {"Authorization": f"Bearer {other_user_token}"}

    # Test that other user cannot access the instance
    response = client.get(
        f"{settings.API_V1_STR}/mcp-instances/{mcp_instance.id}",
        headers=other_user_headers,
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "Not enough permissions"

    # Test that other user cannot update the instance
    response = client.put(
        f"{settings.API_V1_STR}/mcp-instances/{mcp_instance.id}",
        headers=other_user_headers,
        json={"name": "Updated Name"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "Not enough permissions"

    # Test that other user cannot delete the instance
    response = client.delete(
        f"{settings.API_V1_STR}/mcp-instances/{mcp_instance.id}",
        headers=other_user_headers,
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "Not enough permissions"

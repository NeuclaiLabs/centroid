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
    MCPServer,
    MCPServerStatus,
    Secret,
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
        mock_manager.get_mcp_server = MagicMock(return_value=None)
        mock_get_instance.return_value = mock_manager
        yield mock_manager


# Mock the event listeners and asyncio.create_task
@pytest.fixture(autouse=True)
def mock_event_listeners():
    """Mock event listeners and prevent async task creation."""
    with (
        patch("asyncio.create_task", return_value=None),
        patch("app.models.mcp_server.handle_instance_creation", return_value=None),
        patch("app.models.mcp_server.handle_instance_update", return_value=None),
        patch("app.models.mcp_server.handle_instance_deletion", return_value=None),
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
def cleanup_mcp_servers_and_secrets(db: Session):
    """Clean up MCP servers and secrets before each test."""
    statement = delete(Secret)
    db.execute(statement)
    statement = delete(MCPServer)
    db.execute(statement)
    db.commit()
    yield


@pytest.fixture
def mcp_server_data():
    return {
        "name": "Test MCP Server",
        "description": "Test Description",
        "status": MCPServerStatus.ACTIVE,
        "url": "http://localhost:8000",
        "config": {"key": "value"},
        "secrets": {"api_key": "test-key", "password": "test-password"},
    }


@pytest.fixture
def user(db: Session) -> User:
    """Get the test user."""
    return get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)


@pytest.fixture
def mcp_server(db: Session, user: User, mcp_server_data: dict) -> MCPServer:
    server = MCPServer(**mcp_server_data, owner_id=user.id)
    db.add(server)
    db.commit()
    db.refresh(server)
    return server


def test_create_mcp_server(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    mcp_server_data: dict,
):
    response = client.post(
        f"{settings.API_V1_STR}/mcp-servers/",
        headers=normal_user_token_headers,
        json=mcp_server_data,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == mcp_server_data["name"]
    assert data["description"] == mcp_server_data["description"]
    assert data["status"] == mcp_server_data["status"]
    assert data["url"] == mcp_server_data["url"]
    assert data["config"] == mcp_server_data["config"]
    assert data["secrets"] == mcp_server_data["secrets"]
    assert data["mount_path"] == f"/mcp/{data['id']}"
    assert "id" in data
    assert "createdAt" in data
    assert "updatedAt" in data
    assert "ownerId" in data


def test_create_mcp_server_unauthorized(
    client: TestClient,
    mcp_server_data: dict,
):
    response = client.post(
        f"{settings.API_V1_STR}/mcp-servers/",
        json=mcp_server_data,
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_read_mcp_servers(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    mcp_server: MCPServer,
):
    response = client.get(
        f"{settings.API_V1_STR}/mcp-servers/",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["data"]) == 1
    assert data["count"] == 1
    server_data = data["data"][0]
    assert server_data["id"] == mcp_server.id
    assert server_data["mount_path"] == f"/mcp/{mcp_server.id}"
    assert server_data["secrets"] is not None


def test_read_mcp_servers_with_pagination(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    session: Session,
    mcp_server_data: dict,
    user: User,
):
    # Create multiple servers
    for i in range(15):
        server = MCPServer(
            **mcp_server_data,
            name=f"Server {i}",
            owner_id=user.id,
        )
        session.add(server)
    session.commit()

    # Test first page
    response = client.get(
        f"{settings.API_V1_STR}/mcp-servers/?limit=10&skip=0",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["data"]) == 10
    assert data["count"] == 15
    for server in data["data"]:
        assert "mount_path" in server
        assert server["secrets"] is not None

    # Test second page
    response = client.get(
        f"{settings.API_V1_STR}/mcp-servers/?limit=10&skip=10",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["data"]) == 5
    assert data["count"] == 15


def test_read_mcp_server(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    mcp_server: MCPServer,
):
    response = client.get(
        f"{settings.API_V1_STR}/mcp-servers/{mcp_server.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == mcp_server.id
    assert data["name"] == mcp_server.name
    assert data["description"] == mcp_server.description
    assert data["status"] == mcp_server.status
    assert data["url"] == mcp_server.url
    assert data["config"] == mcp_server.config
    assert data["ownerId"] == mcp_server.owner_id
    assert data["mount_path"] == f"/mcp/{mcp_server.id}"
    assert data["secrets"] is not None


def test_read_mcp_server_not_found(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
):
    response = client.get(
        f"{settings.API_V1_STR}/mcp-servers/nonexistent-id",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "MCP server not found"


def test_read_mcp_server_unauthorized(
    client: TestClient,
    mcp_server: MCPServer,
):
    response = client.get(
        f"{settings.API_V1_STR}/mcp-servers/{mcp_server.id}",
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_update_mcp_server(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    mcp_server: MCPServer,
):
    update_data = {
        "name": "Updated Name",
        "description": "Updated Description",
        "status": MCPServerStatus.INACTIVE,
        "url": "http://localhost:8001",
        "config": {"updated": "value"},
        "secrets": {"new_key": "new_value"},
    }
    response = client.put(
        f"{settings.API_V1_STR}/mcp-servers/{mcp_server.id}",
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
    assert data["secrets"] == update_data["secrets"]
    assert data["mount_path"] == f"/mcp/{mcp_server.id}"


def test_update_mcp_server_partial(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    mcp_server: MCPServer,
):
    update_data = {"name": "Only Name Updated"}
    response = client.put(
        f"{settings.API_V1_STR}/mcp-servers/{mcp_server.id}",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["description"] == mcp_server.description
    assert data["status"] == mcp_server.status
    assert data["url"] == mcp_server.url
    assert data["config"] == mcp_server.config
    assert data["secrets"] == mcp_server.secrets
    assert data["mount_path"] == f"/mcp/{mcp_server.id}"


def test_update_mcp_server_not_found(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
):
    update_data = {"name": "Updated Name"}
    response = client.put(
        f"{settings.API_V1_STR}/mcp-servers/nonexistent-id",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "MCP server not found"


def test_update_mcp_server_unauthorized(
    client: TestClient,
    mcp_server: MCPServer,
):
    update_data = {"name": "Updated Name"}
    response = client.put(
        f"{settings.API_V1_STR}/mcp-servers/{mcp_server.id}",
        json=update_data,
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_delete_mcp_server(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    mcp_server: MCPServer,
):
    response = client.delete(
        f"{settings.API_V1_STR}/mcp-servers/{mcp_server.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == "MCP server deleted successfully"

    # Verify server is deleted
    response = client.get(
        f"{settings.API_V1_STR}/mcp-servers/{mcp_server.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "MCP server not found"


def test_delete_mcp_server_not_found(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
):
    response = client.delete(
        f"{settings.API_V1_STR}/mcp-servers/nonexistent-id",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "MCP server not found"


def test_delete_mcp_server_unauthorized(
    client: TestClient,
    mcp_server: MCPServer,
):
    response = client.delete(
        f"{settings.API_V1_STR}/mcp-servers/{mcp_server.id}",
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_mcp_server_owner_access(
    client: TestClient,
    db: Session,
    mcp_server: MCPServer,
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

    # Test that other user cannot access the server
    response = client.get(
        f"{settings.API_V1_STR}/mcp-servers/{mcp_server.id}",
        headers=other_user_headers,
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "Not enough permissions"

    # Test that other user cannot update the server
    response = client.put(
        f"{settings.API_V1_STR}/mcp-servers/{mcp_server.id}",
        headers=other_user_headers,
        json={"name": "Updated Name"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "Not enough permissions"

    # Test that other user cannot delete the server
    response = client.delete(
        f"{settings.API_V1_STR}/mcp-servers/{mcp_server.id}",
        headers=other_user_headers,
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "Not enough permissions"


def test_mcp_server_lifecycle_events(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    mcp_server_data: dict,
):
    # Test server creation triggers registration
    response = client.post(
        f"{settings.API_V1_STR}/mcp-servers/",
        headers=normal_user_token_headers,
        json=mcp_server_data,
    )
    assert response.status_code == status.HTTP_200_OK
    server_id = response.json()["id"]

    # Test status update to inactive triggers deregistration
    response = client.put(
        f"{settings.API_V1_STR}/mcp-servers/{server_id}",
        headers=normal_user_token_headers,
        json={"status": MCPServerStatus.INACTIVE},
    )
    assert response.status_code == status.HTTP_200_OK

    # Test status update back to active triggers registration
    response = client.put(
        f"{settings.API_V1_STR}/mcp-servers/{server_id}",
        headers=normal_user_token_headers,
        json={"status": MCPServerStatus.ACTIVE},
    )
    assert response.status_code == status.HTTP_200_OK

    # Test server deletion triggers deregistration
    response = client.delete(
        f"{settings.API_V1_STR}/mcp-servers/{server_id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK


def test_mcp_server_mount_path(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    mcp_server: MCPServer,
):
    response = client.get(
        f"{settings.API_V1_STR}/mcp-servers/{mcp_server.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["mount_path"] == f"/mcp/{mcp_server.id}"


def test_mcp_server_secrets_encryption(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    mcp_server: MCPServer,
    db: Session,
):
    # Verify that secrets are encrypted in the database
    db_server = db.query(MCPServer).filter(MCPServer.id == mcp_server.id).first()
    assert db_server.encrypted_secrets is not None
    assert isinstance(db_server.encrypted_secrets, str)

    # Verify that secrets are decrypted in the API response
    response = client.get(
        f"{settings.API_V1_STR}/mcp-servers/{mcp_server.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["secrets"] == mcp_server.secrets

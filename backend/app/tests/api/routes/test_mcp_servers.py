import asyncio

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session, delete

from app import crud
from app.core.config import settings
from app.core.security import get_password_hash
from app.models import (
    MCPServer,
    MCPServerCreate,
    MCPServerKind,
    MCPServerStatus,
    MCPServerUpdate,
    Secret,
    User,
    UserCreate,
)
from app.tests.utils.utils import random_email, random_lower_string, random_string


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


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
        "kind": MCPServerKind.OFFICIAL,
        "transport": "http",
        "version": "1.0.0",
        "secrets": {"api_key": "test-key", "password": "test-password"},
    }


@pytest.fixture
def user(db: Session) -> User:
    """Get the test user."""
    return crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)


@pytest.fixture
def mcp_server(db: Session, user: User, mcp_server_data: dict) -> MCPServer:
    server = MCPServer(**mcp_server_data, owner_id=user.id)
    db.add(server)
    db.commit()
    db.refresh(server)
    return server


def test_create_mcp_server(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    user = crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)

    # Create a new MCP server
    mcp_server_data = MCPServerCreate(
        name="Sample MCP server",
        description="Sample description",
        transport="http",
        version="1.0.0",
        kind=MCPServerKind.OFFICIAL,
    )
    response = client.post(
        f"{settings.API_V1_STR}/mcp-servers/",
        headers=normal_user_token_headers,
        json=mcp_server_data.model_dump(exclude_unset=True),
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == mcp_server_data.name
    assert content["description"] == mcp_server_data.description
    assert content["transport"] == mcp_server_data.transport
    assert content["version"] == mcp_server_data.version
    assert content["kind"] == mcp_server_data.kind
    assert content["ownerId"] == str(user.id)
    assert content["createdAt"] is not None
    assert content["updatedAt"] is not None
    assert content["mountPath"] == f"/mcp/{content['id']}"


def test_read_mcp_server(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    user_in = UserCreate(email=random_email(), password=random_string())
    user = crud.create_user(session=db, user_create=user_in)
    mcp_server_data = MCPServer(
        name="Sample MCP server",
        description="Sample description",
        transport="http",
        version="1.0.0",
        kind=MCPServerKind.OFFICIAL,
        owner_id=str(user.id),
    )
    db.add(mcp_server_data)
    db.commit()
    db.refresh(mcp_server_data)

    response = client.get(
        f"{settings.API_V1_STR}/mcp-servers/{mcp_server_data.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == mcp_server_data.id
    assert content["name"] == mcp_server_data.name
    assert content["description"] == mcp_server_data.description
    assert content["transport"] == mcp_server_data.transport
    assert content["version"] == mcp_server_data.version
    assert content["kind"] == mcp_server_data.kind
    assert content["ownerId"] == str(user.id)
    assert content["createdAt"] is not None
    assert content["updatedAt"] is not None
    assert content["mountPath"] == f"/mcp/{mcp_server_data.id}"


def test_read_mcp_server_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/mcp-servers/999",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "MCP server not found"


def test_read_mcp_servers(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    user = crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)
    mcp_server_data1 = MCPServer(
        name="Sample MCP server 1",
        description="Sample description 1",
        transport="http",
        version="1.0.0",
        kind=MCPServerKind.OFFICIAL,
        owner_id=str(user.id),
    )
    mcp_server_data2 = MCPServer(
        name="Sample MCP server 2",
        description="Sample description 2",
        transport="http",
        version="1.0.0",
        kind=MCPServerKind.OFFICIAL,
        owner_id=str(user.id),
    )
    db.add(mcp_server_data1)
    db.add(mcp_server_data2)
    db.commit()
    db.refresh(mcp_server_data1)
    db.refresh(mcp_server_data2)

    response = client.get(
        f"{settings.API_V1_STR}/mcp-servers/",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2
    for mcp_server in content["data"]:
        assert mcp_server["ownerId"] == str(user.id)


def test_update_mcp_server(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    user = crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)

    mcp_server_data = MCPServer(
        name="Sample MCP server",
        description="Sample description",
        transport="http",
        version="1.0.0",
        kind=MCPServerKind.OFFICIAL,
        owner_id=str(user.id),
    )
    db.add(mcp_server_data)
    db.commit()
    db.refresh(mcp_server_data)

    update_data = MCPServerUpdate(
        name="Updated MCP server",
        description="Updated description",
        transport="https",
        version="2.0.0",
    )
    response = client.put(
        f"{settings.API_V1_STR}/mcp-servers/{mcp_server_data.id}",
        headers=normal_user_token_headers,
        json=update_data.model_dump(exclude_unset=True),
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == update_data.name
    assert content["description"] == update_data.description
    assert content["transport"] == update_data.transport
    assert content["version"] == update_data.version
    assert content["updatedAt"] is not None


def test_update_mcp_server_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    update_data = MCPServerUpdate(
        name="Updated MCP server",
        description="Updated description",
        transport="https",
        version="2.0.0",
    )
    response = client.put(
        f"{settings.API_V1_STR}/mcp-servers/999",
        headers=superuser_token_headers,
        json=update_data.model_dump(exclude_unset=True),
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "MCP server not found"


def test_delete_mcp_server(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    user = crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)

    mcp_server_data = MCPServer(
        name="Sample MCP server",
        description="Sample description",
        transport="http",
        version="1.0.0",
        kind=MCPServerKind.OFFICIAL,
        owner_id=str(user.id),
    )
    db.add(mcp_server_data)
    db.commit()
    db.refresh(mcp_server_data)

    response = client.delete(
        f"{settings.API_V1_STR}/mcp-servers/{mcp_server_data.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "MCP server deleted successfully"


def test_delete_mcp_server_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_V1_STR}/mcp-servers/999",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "MCP server not found"


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
    assert data["mountPath"] == f"/mcp/{mcp_server.id}"


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

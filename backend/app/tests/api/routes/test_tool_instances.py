import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session, delete

from app.core.config import settings
from app.core.security import get_password_hash
from app.models import (
    MCPInstance,
    ToolInstance,
    ToolInstanceStatus,
    User,
)
from app.tests.utils.utils import random_email, random_lower_string


@pytest.fixture(autouse=True)
def cleanup_tool_instances(db: Session):
    """Clean up tool instances before each test."""
    statement = delete(ToolInstance)
    db.execute(statement)
    db.commit()
    yield


@pytest.fixture
def tool_instance_data():
    return {
        "status": ToolInstanceStatus.ACTIVE,
        "config": {"key": "value"},
        "tool_schema": {"type": "object", "properties": {}},
        "tool_metadata": {"name": "Test Tool"},
    }


@pytest.fixture
def user(db: Session) -> User:
    """Create a test user."""
    email = random_email()
    password = random_lower_string()
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        full_name="Test User",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def mcp_instance(db: Session, user: User) -> MCPInstance:
    """Create a test MCP instance."""
    instance = MCPInstance(
        name="Test MCP Instance",
        description="Test Description",
        status="active",
        url="http://localhost:8000",
        config={"key": "value"},
        owner_id=user.id,
    )
    db.add(instance)
    db.commit()
    db.refresh(instance)
    return instance


@pytest.fixture
def tool_instance(
    db: Session, user: User, mcp_instance: MCPInstance, tool_instance_data: dict
) -> ToolInstance:
    """Create a test tool instance."""
    instance = ToolInstance(
        **tool_instance_data,
        owner_id=user.id,
        mcp_instance_id=mcp_instance.id,
    )
    db.add(instance)
    db.commit()
    db.refresh(instance)
    return instance


def test_create_tool_instance(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    tool_instance_data: dict,
    mcp_instance: MCPInstance,
):
    """Test creating a tool instance via API."""
    # Add mcp_instance_id to the data
    data = {**tool_instance_data, "mcp_instance_id": mcp_instance.id}

    response = client.post(
        f"{settings.API_V1_STR}/tool-instances/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == tool_instance_data["status"]
    assert data["config"] == tool_instance_data["config"]
    assert data["tool_schema"] == tool_instance_data["tool_schema"]
    assert data["tool_metadata"] == tool_instance_data["tool_metadata"]
    assert data["mcp_instance_id"] == mcp_instance.id
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert "owner_id" in data


def test_create_tool_instance_unauthorized(
    client: TestClient,
    tool_instance_data: dict,
    mcp_instance: MCPInstance,
):
    """Test creating a tool instance without authentication."""
    # Add mcp_instance_id to the data
    data = {**tool_instance_data, "mcp_instance_id": mcp_instance.id}

    response = client.post(
        f"{settings.API_V1_STR}/tool-instances/",
        json=data,
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_read_tool_instances(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    tool_instance: ToolInstance,
):
    """Test reading all tool instances."""
    response = client.get(
        f"{settings.API_V1_STR}/tool-instances/",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["data"]) == 1
    assert data["count"] == 1
    assert data["data"][0]["id"] == tool_instance.id


def test_read_tool_instances_with_pagination(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    session: Session,
    tool_instance_data: dict,
    user: User,
    mcp_instance: MCPInstance,
):
    """Test reading tool instances with pagination."""
    # Create multiple instances
    for _ in range(15):
        instance = ToolInstance(
            **tool_instance_data,
            owner_id=user.id,
            mcp_instance_id=mcp_instance.id,
        )
        session.add(instance)
    session.commit()

    # Test first page
    response = client.get(
        f"{settings.API_V1_STR}/tool-instances/?limit=10&skip=0",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["data"]) == 10
    assert data["count"] == 15

    # Test second page
    response = client.get(
        f"{settings.API_V1_STR}/tool-instances/?limit=10&skip=10",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["data"]) == 5
    assert data["count"] == 15


def test_read_tool_instance(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    tool_instance: ToolInstance,
):
    """Test reading a specific tool instance."""
    response = client.get(
        f"{settings.API_V1_STR}/tool-instances/{tool_instance.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == tool_instance.id
    assert data["status"] == tool_instance.status
    assert data["config"] == tool_instance.config
    assert data["tool_schema"] == tool_instance.tool_schema
    assert data["tool_metadata"] == tool_instance.tool_metadata
    assert data["mcp_instance_id"] == tool_instance.mcp_instance_id
    assert data["owner_id"] == tool_instance.owner_id


def test_read_tool_instance_not_found(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
):
    """Test reading a non-existent tool instance."""
    response = client.get(
        f"{settings.API_V1_STR}/tool-instances/nonexistent-id",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "Tool instance not found"


def test_read_tool_instance_unauthorized(
    client: TestClient,
    tool_instance: ToolInstance,
):
    """Test reading a tool instance without authentication."""
    response = client.get(
        f"{settings.API_V1_STR}/tool-instances/{tool_instance.id}",
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_update_tool_instance(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    tool_instance: ToolInstance,
):
    """Test updating a tool instance."""
    update_data = {
        "status": ToolInstanceStatus.INACTIVE,
        "config": {"updated": "value"},
    }
    response = client.put(
        f"{settings.API_V1_STR}/tool-instances/{tool_instance.id}",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == update_data["status"]
    assert data["config"] == update_data["config"]


def test_update_tool_instance_partial(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    tool_instance: ToolInstance,
):
    """Test partial update of a tool instance."""
    update_data = {"status": ToolInstanceStatus.INACTIVE}
    response = client.put(
        f"{settings.API_V1_STR}/tool-instances/{tool_instance.id}",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == update_data["status"]
    assert data["config"] == tool_instance.config
    assert data["tool_schema"] == tool_instance.tool_schema
    assert data["tool_metadata"] == tool_instance.tool_metadata


def test_update_tool_instance_not_found(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
):
    """Test updating a non-existent tool instance."""
    update_data = {"status": ToolInstanceStatus.INACTIVE}
    response = client.put(
        f"{settings.API_V1_STR}/tool-instances/nonexistent-id",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "Tool instance not found"


def test_update_tool_instance_unauthorized(
    client: TestClient,
    tool_instance: ToolInstance,
):
    """Test updating a tool instance without authentication."""
    update_data = {"status": ToolInstanceStatus.INACTIVE}
    response = client.put(
        f"{settings.API_V1_STR}/tool-instances/{tool_instance.id}",
        json=update_data,
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_delete_tool_instance(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    tool_instance: ToolInstance,
):
    """Test deleting a tool instance."""
    response = client.delete(
        f"{settings.API_V1_STR}/tool-instances/{tool_instance.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == "Tool instance deleted successfully"

    # Verify instance is deleted
    response = client.get(
        f"{settings.API_V1_STR}/tool-instances/{tool_instance.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "Tool instance not found"


def test_delete_tool_instance_not_found(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
):
    """Test deleting a non-existent tool instance."""
    response = client.delete(
        f"{settings.API_V1_STR}/tool-instances/nonexistent-id",
        headers=normal_user_token_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "Tool instance not found"


def test_delete_tool_instance_unauthorized(
    client: TestClient,
    tool_instance: ToolInstance,
):
    """Test deleting a tool instance without authentication."""
    response = client.delete(
        f"{settings.API_V1_STR}/tool-instances/{tool_instance.id}",
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_tool_instance_owner_access(
    client: TestClient,
    db: Session,
    tool_instance: ToolInstance,
):
    """Test that only the owner can access their tool instances."""
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
        f"{settings.API_V1_STR}/tool-instances/{tool_instance.id}",
        headers=other_user_headers,
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "Not enough permissions"

    # Test that other user cannot update the instance
    response = client.put(
        f"{settings.API_V1_STR}/tool-instances/{tool_instance.id}",
        headers=other_user_headers,
        json={"status": ToolInstanceStatus.INACTIVE},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "Not enough permissions"

    # Test that other user cannot delete the instance
    response = client.delete(
        f"{settings.API_V1_STR}/tool-instances/{tool_instance.id}",
        headers=other_user_headers,
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "Not enough permissions"

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, delete

from app.core.config import settings
from app.core.security import get_password_hash
from app.crud import get_user_by_email
from app.models import Connection, MCPInstance, User
from app.models.connection import (
    ApiKeyAuth,
    AuthConfig,
    AuthType,
)
from app.tests.utils.connection import create_random_connection
from app.tests.utils.utils import random_string


@pytest.fixture(autouse=True)
def cleanup_connections(db: Session):
    """Clean up connections before each test."""
    # Clean up in reverse order of dependencies
    statement = delete(MCPInstance)
    db.execute(statement)
    statement = delete(Connection)
    db.execute(statement)
    db.commit()
    yield


@pytest.fixture
def valid_connection_data():
    return {
        "name": "Test Connection",
        "description": "A test connection",
        "provider_id": random_string(),
        "base_url": "https://api.example.com",
        "auth": {
            "type": AuthType.BASIC,
            "config": {
                "username": "test-user",
                "password": "test-password",
            },
        },
    }


def test_create_connection_success(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    valid_connection_data: dict,
    db: Session,
):
    response = client.post(
        f"{settings.API_V1_STR}/connections/",
        headers=normal_user_token_headers,
        json=valid_connection_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == valid_connection_data["name"]
    assert content["description"] == valid_connection_data["description"]
    assert content["providerId"] == valid_connection_data["provider_id"]
    assert content["baseUrl"] == valid_connection_data["base_url"]
    assert content["auth"] == valid_connection_data["auth"]
    assert "id" in content
    assert "createdAt" in content
    assert "updatedAt" in content
    assert "ownerId" in content

    # # Verify owner is the test user
    user = get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)
    assert content["ownerId"] == user.id


def test_create_connection_invalid_auth(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    valid_connection_data: dict,
):
    # Test with invalid auth type
    invalid_data = valid_connection_data.copy()
    invalid_data["auth"] = {"type": "invalid_type", "config": {}}
    response = client.post(
        f"{settings.API_V1_STR}/connections/",
        headers=normal_user_token_headers,
        json=invalid_data,
    )
    assert response.status_code == 422


def test_read_connections_pagination(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    db: Session,
):
    # Get the test user
    user = get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)

    # Create multiple connections
    for _ in range(3):
        create_random_connection(session=db, owner_id=user.id)

    print("Connections created!!!")

    # Test default pagination
    response = client.get(
        f"{settings.API_V1_STR}/connections/",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) == 3
    assert content["count"] == 3
    # Verify owner_id in response
    for conn in content["data"]:
        assert conn["ownerId"] == user.id

    # Test with limit
    response = client.get(
        f"{settings.API_V1_STR}/connections/?limit=2",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) == 2
    assert content["count"] == 3

    # Test with skip
    response = client.get(
        f"{settings.API_V1_STR}/connections/?skip=2",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) == 1
    assert content["count"] == 3


def test_read_connection_success(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    db: Session,
):
    # Get the test user
    user = get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)
    connection = create_random_connection(session=db, owner_id=user.id)

    response = client.get(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == connection.id
    assert content["name"] == connection.name
    assert content["ownerId"] == user.id
    assert "auth" in content


def test_read_connection_not_found(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
):
    response = client.get(
        f"{settings.API_V1_STR}/connections/nonexistent-id",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Connection not found"


def test_update_connection_success(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    db: Session,
    valid_connection_data: dict,
):
    # Get the test user
    user = get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)
    connection = create_random_connection(session=db, owner_id=user.id)

    # Remove owner_id from update data as it shouldn't be updateable
    update_data = valid_connection_data.copy()
    update_data.pop("owner_id", None)

    response = client.put(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == update_data["name"]
    assert content["description"] == update_data["description"]
    assert content["auth"] == update_data["auth"]
    assert content["ownerId"] == user.id


def test_update_connection_not_found(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    valid_connection_data: dict,
):
    response = client.put(
        f"{settings.API_V1_STR}/connections/nonexistent-id",
        headers=normal_user_token_headers,
        json=valid_connection_data,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Connection not found"


def test_delete_connection_success(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    db: Session,
):
    # Get the test user
    user = get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)
    connection = create_random_connection(session=db, owner_id=user.id)

    response = client.delete(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Connection deleted successfully"

    response = client.get(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Connection not found"


def test_delete_connection_not_found(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
):
    response = client.delete(
        f"{settings.API_V1_STR}/connections/nonexistent-id",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Connection not found"


def test_connection_auth_encryption(db: Session):
    """Test that connection auth is properly encrypted and decrypted"""
    auth_config = AuthConfig(
        type=AuthType.API_KEY,
        config=ApiKeyAuth(key="X-API-Key", value="secret-key", location="header"),
    )

    # Get or create test user
    user = get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)
    if not user:
        user = User(
            email=settings.EMAIL_TEST_USER,
            hashed_password=get_password_hash("testpass123"),
            full_name="Test User",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    connection = Connection(
        name="Test",
        provider_id=random_string(),
        base_url="https://api.test.com",
        auth=auth_config,
        owner_id=user.id,
    )
    assert db is not None

    # Check that auth is encrypted
    assert connection.encrypted_auth is not None
    assert connection.encrypted_auth != str(auth_config.model_dump())

    # Check that auth can be decrypted
    decrypted_auth = connection.auth
    assert decrypted_auth.type == AuthType.API_KEY
    config = ApiKeyAuth.model_validate(decrypted_auth.config)
    assert config.key == "X-API-Key"
    assert config.value == "secret-key"
    assert config.location == "header"


def test_unauthorized_access(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    db: Session,
):
    # Create a different user
    other_user = get_user_by_email(session=db, email="other@example.com")
    if not other_user:
        other_user = User(
            email="other@example.com",
            hashed_password=get_password_hash("testpass123"),
            full_name="Other Test User",
            is_active=True,
        )
        db.add(other_user)
        db.commit()
        db.refresh(other_user)

    # Create a connection owned by the other user
    connection = create_random_connection(session=db, owner_id=other_user.id)

    # Try to access the connection as normal user
    response = client.get(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"

    # Try to update the connection
    response = client.put(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=normal_user_token_headers,
        json={"name": "Updated Name"},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"

    # Try to delete the connection
    response = client.delete(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.models.connection import ApiKeyAuth, AuthConfig, AuthType, Connection
from app.tests.utils.connection import create_random_connection


@pytest.fixture
def valid_connection_data():
    return {
        "name": "Test Connection",
        "description": "A test connection",
        "kind": "api",
        "base_url": "https://api.example.com",
        "auth": {
            "type": AuthType.API_KEY,
            "config": {"key": "X-API-Key", "value": "test-key", "location": "header"},
        },
    }


def test_create_connection_success(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    valid_connection_data: dict,
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
    assert content["kind"] == valid_connection_data["kind"]
    assert content["baseUrl"] == valid_connection_data["base_url"]
    assert content["auth"] == valid_connection_data["auth"]
    assert "id" in content
    assert "created_at" in content
    assert "updated_at" in content


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
    # Create multiple connections
    for _ in range(3):
        create_random_connection(db)

    # Test default pagination
    response = client.get(
        f"{settings.API_V1_STR}/connections/",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) == 3
    assert content["count"] == 3

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
    connection = create_random_connection(db)
    response = client.get(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == connection.id
    assert content["name"] == connection.name
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
    connection = create_random_connection(db)
    response = client.put(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=normal_user_token_headers,
        json=valid_connection_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == valid_connection_data["name"]
    assert content["description"] == valid_connection_data["description"]
    assert content["auth"] == valid_connection_data["auth"]


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
    connection = create_random_connection(db)
    response = client.delete(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Connection deleted successfully"

    # Verify connection is deleted
    assert db.get(Connection, connection.id) is None


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

    connection = Connection(
        name="Test", kind="api", base_url="https://api.test.com", auth=auth_config
    )
    assert db is not None

    # Check that auth is encrypted
    assert connection.encrypted_auth is not None
    assert connection.encrypted_auth != str(auth_config.model_dump())

    # Check that auth can be decrypted
    decrypted_auth = connection.auth
    assert decrypted_auth.type == AuthType.API_KEY
    assert decrypted_auth.config.key == "X-API-Key"
    assert decrypted_auth.config.value == "secret-key"

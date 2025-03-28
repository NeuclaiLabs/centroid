from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.tests.utils.connection import create_random_connection


def test_create_connection(
    client: TestClient, normal_user_token_headers: dict[str, str]
):
    data = {
        "name": "Test Connection",
        "description": "A test connection",
        "kind": "api",
        "base_url": "https://api.example.com",
        "auth": {"api_key": "test-key"},
    }
    response = client.post(
        f"{settings.API_V1_STR}/connections/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["description"] == data["description"]
    assert content["kind"] == data["kind"]
    assert content["base_url"] == data["base_url"]
    assert content["auth"] == data["auth"]
    assert "id" in content


def test_read_connections(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
):
    connection = create_random_connection(db)
    response = client.get(
        f"{settings.API_V1_STR}/connections/",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["data"][0]["name"] == connection.name
    assert content["data"][0]["description"] == connection.description


def test_read_connection(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
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


def test_update_connection(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
):
    connection = create_random_connection(db)
    data = {
        "name": "Updated Connection Name",
        "description": "Updated description",
        "kind": "oauth2",
        "base_url": "https://updated-api.example.com",
        "auth": {"client_id": "new-client-id", "client_secret": "new-client-secret"},
    }
    response = client.put(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["description"] == data["description"]
    assert content["kind"] == data["kind"]
    assert content["base_url"] == data["base_url"]
    assert content["auth"] == data["auth"]


def test_delete_connection(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
):
    connection = create_random_connection(db)
    response = client.delete(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Connection deleted successfully"


def test_read_connection_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str]
):
    response = client.get(
        f"{settings.API_V1_STR}/connections/nonexistent-id",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404

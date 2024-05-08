from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.tests.utils.connection import create_random_connection


def test_create_connection(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"name": "Test Connection", "type": "test", "data": {"key": "value"}}
    response = client.post(
        f"{settings.API_V1_STR}/connections/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["type"] == data["type"]
    assert content["data"] == data["data"]
    assert "id" in content
    assert "owner_id" in content


def test_read_connection(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    connection = create_random_connection(db)
    response = client.get(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == connection.name
    assert content["type"] == connection.type
    assert content["data"] == connection.data
    assert content["id"] == connection.id
    assert content["owner_id"] == connection.owner_id


def test_read_connection_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/connections/999",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Connection not found"


def test_read_connection_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    connection = create_random_connection(db)
    response = client.get(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 400
    content = response.json()
    assert content["detail"] == "Not enough permissions"


def test_read_connections(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_random_connection(db)
    create_random_connection(db)
    response = client.get(
        f"{settings.API_V1_STR}/connections/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2


def test_update_connection(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    connection = create_random_connection(db)
    data = {"name": "Updated name", "type": "updated", "data": {"new_key": "new_value"}}
    response = client.put(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["type"] == data["type"]
    assert content["data"] == data["data"]
    assert content["id"] == connection.id
    assert content["owner_id"] == connection.owner_id


def test_update_connection_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"name": "Updated name", "type": "updated", "data": {"new_key": "new_value"}}
    response = client.put(
        f"{settings.API_V1_STR}/connections/999",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Connection not found"


def test_update_connection_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    connection = create_random_connection(db)
    data = {"name": "Updated name", "type": "updated", "data": {"new_key": "new_value"}}
    response = client.put(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 400
    content = response.json()
    assert content["detail"] == "Not enough permissions"


def test_delete_connection(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    connection = create_random_connection(db)
    response = client.delete(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Connection deleted successfully"


def test_delete_connection_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_V1_STR}/connections/999",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Connection not found"


def test_delete_connection_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    connection = create_random_connection(db)
    response = client.delete(
        f"{settings.API_V1_STR}/connections/{connection.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 400
    content = response.json()
    assert content["detail"] == "Not enough permissions"

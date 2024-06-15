from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.tests.utils.action import create_random_action


def test_create_action(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {
        "chat_id": "test_chat",
        "parent_id": None,
        "kind": "test_kind",
        "steps": {"key": "value"},
        "status": "pending",
        "result": None,
    }
    response = client.post(
        f"{settings.API_V1_STR}/actions/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["chat_id"] == data["chat_id"]
    assert content["parent_id"] == data["parent_id"]
    assert content["kind"] == data["kind"]
    assert content["steps"] == data["steps"]
    assert content["result"] == data["result"]
    assert content["status"] == data["status"]
    assert "id" in content
    assert "owner_id" in content


def test_read_action(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    action = create_random_action(db)
    response = client.get(
        f"{settings.API_V1_STR}/actions/{action.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["chat_id"] == action.chat_id
    assert content["parent_id"] == action.parent_id
    assert content["kind"] == action.kind
    assert content["steps"] == action.steps
    assert content["result"] == action.result
    assert content["status"] == action.status
    assert content["id"] == action.id
    assert content["owner_id"] == action.owner_id


def test_read_action_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/actions/999",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Action not found"


def test_read_action_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    action = create_random_action(db)
    response = client.get(
        f"{settings.API_V1_STR}/actions/{action.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 400
    content = response.json()
    assert content["detail"] == "Not enough permissions"


def test_read_actions(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_random_action(db)
    create_random_action(db)
    response = client.get(
        f"{settings.API_V1_STR}/actions/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2


def test_update_action(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    action = create_random_action(db)
    data = {
        "chat_id": "updated_chat",
        "parent_id": "updated_parent",
        "kind": "updated_kind",
        "steps": {"new_key": "new_value"},
        "result": {"result_key": "result_value"},
        "status": "completed",
    }
    response = client.put(
        f"{settings.API_V1_STR}/actions/{action.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["chat_id"] == data["chat_id"]
    assert content["parent_id"] == data["parent_id"]
    assert content["kind"] == data["kind"]
    assert content["steps"] == data["steps"]
    assert content["result"] == data["result"]
    assert content["status"] == data["status"]
    assert content["id"] == action.id
    assert content["owner_id"] == action.owner_id


def test_update_action_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {
        "chat_id": "updated_chat",
        "parent_id": "updated_parent",
        "kind": "updated_kind",
        "steps": {"new_key": "new_value"},
        "result": {"result_key": "result_value"},
        "status": "completed",
    }
    response = client.put(
        f"{settings.API_V1_STR}/actions/999",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Action not found"


def test_update_action_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    action = create_random_action(db)
    data = {
        "chat_id": "updated_chat",
        "parent_id": "updated_parent",
        "kind": "updated_kind",
        "steps": {"new_key": "new_value"},
        "result": {"result_key": "result_value"},
        "status": "completed",
    }
    response = client.put(
        f"{settings.API_V1_STR}/actions/{action.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 400
    content = response.json()
    assert content["detail"] == "Not enough permissions"


def test_delete_action(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    action = create_random_action(db)
    response = client.delete(
        f"{settings.API_V1_STR}/actions/{action.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Action deleted successfully"


def test_delete_action_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_V1_STR}/actions/999",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Action not found"


def test_delete_action_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    action = create_random_action(db)
    response = client.delete(
        f"{settings.API_V1_STR}/actions/{action.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 400
    content = response.json()
    assert content["detail"] == "Not enough permissions"

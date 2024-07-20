from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.tests.utils.tool_call import create_random_tool_call


def test_create_tool_call(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {
        "chat_id": "test_chat",
        "kind": "test_kind",
        "result": None,
        "status": "pending",
        "payload": {"key": "value"},
    }
    response = client.post(
        f"{settings.API_V1_STR}/tool-calls/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["chat_id"] == data["chat_id"]
    assert content["kind"] == data["kind"]
    assert content["result"] == data["result"]
    assert content["status"] == data["status"]
    assert content["payload"] == data["payload"]
    assert "id" in content
    assert "owner_id" in content


def test_read_tool_call(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    tool_call = create_random_tool_call(db)
    response = client.get(
        f"{settings.API_V1_STR}/tool-calls/{tool_call.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["chat_id"] == tool_call.chat_id
    assert content["kind"] == tool_call.kind
    assert content["result"] == tool_call.result
    assert content["status"] == tool_call.status
    assert content["payload"] == tool_call.payload
    assert content["id"] == tool_call.id
    assert content["owner_id"] == tool_call.owner_id


def test_read_tool_call_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/tool-calls/999",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Tool call not found"


def test_read_tool_call_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    tool_call = create_random_tool_call(db)
    response = client.get(
        f"{settings.API_V1_STR}/tool-calls/{tool_call.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 400
    content = response.json()
    assert content["detail"] == "Not enough permissions"


def test_read_tool_calls(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_random_tool_call(db)
    create_random_tool_call(db)
    response = client.get(
        f"{settings.API_V1_STR}/tool-calls/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2


def test_update_tool_call(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    tool_call = create_random_tool_call(db)
    data = {
        "chat_id": "updated_chat",
        "kind": "updated_kind",
        "result": {"result_key": "result_value"},
        "status": "completed",
        "payload": {"new_key": "new_value"},
    }
    response = client.put(
        f"{settings.API_V1_STR}/tool-calls/{tool_call.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["chat_id"] == data["chat_id"]
    assert content["kind"] == data["kind"]
    assert content["result"] == data["result"]
    assert content["status"] == data["status"]
    assert content["payload"] == data["payload"]
    assert content["id"] == tool_call.id
    assert content["owner_id"] == tool_call.owner_id


def test_update_tool_call_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {
        "chat_id": "updated_chat",
        "kind": "updated_kind",
        "result": {"result_key": "result_value"},
        "status": "completed",
        "payload": {"new_key": "new_value"},
    }
    response = client.put(
        f"{settings.API_V1_STR}/tool-calls/999",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Tool call not found"


def test_update_tool_call_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    tool_call = create_random_tool_call(db)
    data = {
        "chat_id": "updated_chat",
        "kind": "updated_kind",
        "result": {"result_key": "result_value"},
        "status": "completed",
        "payload": {"new_key": "new_value"},
    }
    response = client.put(
        f"{settings.API_V1_STR}/tool-calls/{tool_call.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 400
    content = response.json()
    assert content["detail"] == "Not enough permissions"


def test_delete_tool_call(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    tool_call = create_random_tool_call(db)
    response = client.delete(
        f"{settings.API_V1_STR}/tool-calls/{tool_call.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Tool call deleted successfully"


def test_delete_tool_call_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_V1_STR}/tool-calls/999",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Tool call not found"


def test_delete_tool_call_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    tool_call = create_random_tool_call(db)
    response = client.delete(
        f"{settings.API_V1_STR}/tool-calls/{tool_call.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 400
    content = response.json()
    assert content["detail"] == "Not enough permissions"

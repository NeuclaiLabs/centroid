from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.core.config import settings
from app.models import (
    ToolDefinition,
    ToolDefinitionCreate,
    ToolDefinitionUpdate,
)
from app.tests.utils.utils import random_string


def test_create_tool_definition(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    tool_data = ToolDefinitionCreate(
        app_id=random_string(),
        tool_schema={"type": "object", "properties": {}},
        tool_metadata={"name": "test_tool"},
    )
    response = client.post(
        f"{settings.API_V1_STR}/tool-definitions/",
        headers=normal_user_token_headers,
        json=tool_data.model_dump(exclude_unset=True),
    )
    assert response.status_code == 200
    content = response.json()
    assert content["appId"] == tool_data.app_id
    assert content["toolSchema"] == tool_data.tool_schema
    assert content["toolMetadata"] == tool_data.tool_metadata
    assert content["createdAt"] is not None
    assert content["updatedAt"] is not None


def test_read_tool_definition(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    tool_data = ToolDefinition(
        app_id=random_string(),
        tool_schema={"type": "object", "properties": {}},
        tool_metadata={"name": "test_tool"},
    )
    crud.create_tool_definition(session=db, tool_definition=tool_data)
    response = client.get(
        f"{settings.API_V1_STR}/tool-definitions/{tool_data.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == tool_data.id
    assert content["appId"] == tool_data.app_id
    assert content["toolSchema"] == tool_data.tool_schema
    assert content["toolMetadata"] == tool_data.tool_metadata
    assert content["createdAt"] is not None
    assert content["updatedAt"] is not None


def test_read_tool_definition_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/tool-definitions/{random_string()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Tool not found"


def test_read_tool_definitions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    tool_data1 = ToolDefinition(
        app_id=random_string(),
        tool_schema={"type": "object", "properties": {}},
        tool_metadata={"name": "test_tool_1"},
    )
    tool_data2 = ToolDefinition(
        app_id=random_string(),
        tool_schema={"type": "object", "properties": {}},
        tool_metadata={"name": "test_tool_2"},
    )
    crud.create_tool_definition(session=db, tool_definition=tool_data1)
    crud.create_tool_definition(session=db, tool_definition=tool_data2)
    response = client.get(
        f"{settings.API_V1_STR}/tool-definitions/",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2
    assert content["count"] >= 2


def test_update_tool_definition(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    tool_data = ToolDefinition(
        app_id=random_string(),
        tool_schema={"type": "object", "properties": {}},
        tool_metadata={"name": "test_tool"},
    )
    crud.create_tool_definition(session=db, tool_definition=tool_data)
    update_data = ToolDefinitionUpdate(
        app_id=random_string(),
        tool_schema={"type": "object", "properties": {"updated": True}},
        tool_metadata={"name": "updated_test_tool"},
    )
    print(update_data)
    response = client.put(
        f"{settings.API_V1_STR}/tool-definitions/{tool_data.id}",
        headers=normal_user_token_headers,
        json={
            "app_id": update_data.app_id,
            "tool_schema": update_data.tool_schema,
            "tool_metadata": update_data.tool_metadata,
        },
    )
    assert response.status_code == 200
    content = response.json()
    assert content["appId"] == update_data.app_id
    assert content["toolSchema"] == update_data.tool_schema
    assert content["toolMetadata"] == update_data.tool_metadata
    assert content["updatedAt"] is not None


def test_update_tool_definition_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    update_data = ToolDefinitionUpdate(
        app_id=random_string(),
        tool_schema={"type": "object", "properties": {}},
        tool_metadata={"name": "test_tool"},
    )
    response = client.put(
        f"{settings.API_V1_STR}/tool-definitions/{random_string()}",
        headers=superuser_token_headers,
        json=update_data.model_dump(exclude_unset=True),
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Tool not found"


def test_delete_tool_definition(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    tool_data = ToolDefinition(
        app_id=random_string(),
        tool_schema={"type": "object", "properties": {}},
        tool_metadata={"name": "test_tool"},
    )
    crud.create_tool_definition(session=db, tool_definition=tool_data)
    response = client.delete(
        f"{settings.API_V1_STR}/tool-definitions/{tool_data.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Tool deleted successfully"


def test_delete_tool_definition_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_V1_STR}/tool-definitions/{random_string()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Tool not found"

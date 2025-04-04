import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, delete

from app import crud
from app.core.config import settings
from app.models import (
    ToolDefinition,
    ToolInstance,
    ToolInstanceCreate,
    ToolInstanceStatus,
    ToolInstanceUpdate,
)
from app.tests.utils.user import create_random_user
from app.tests.utils.utils import random_string


@pytest.fixture(autouse=True)
def cleanup_tool_instances(db: Session):
    """Clean up tool instances before each test."""
    statement = delete(ToolInstance)
    db.execute(statement)
    db.commit()
    yield


def test_create_tool_instance(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # First create a tool definition
    tool_def = ToolDefinition(
        app_id=random_string(),
        tool_schema={"type": "object", "properties": {}},
        tool_metadata={"name": "test_tool"},
    )
    crud.create_tool_definition(session=db, tool_definition=tool_def)

    # Get the user
    user = crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)

    tool_data = ToolInstanceCreate(
        definition_id=tool_def.id,
        status=ToolInstanceStatus.ACTIVE,
        owner_id=user.id,
        app_id=tool_def.app_id,
    )
    response = client.post(
        f"{settings.API_V1_STR}/tool-instances/",
        headers=normal_user_token_headers,
        json=tool_data.model_dump(exclude_unset=True),
    )
    assert response.status_code == 200
    content = response.json()
    assert content["definitionId"] == tool_data.definition_id
    assert content["status"] == ToolInstanceStatus.ACTIVE
    assert content["ownerId"] == user.id
    assert content["appId"] == tool_data.app_id
    assert content["createdAt"] is not None
    assert content["updatedAt"] is not None


def test_read_tool_instance(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    # First create a tool definition
    tool_def = ToolDefinition(
        app_id=random_string(),
        tool_schema={"type": "object", "properties": {}},
        tool_metadata={"name": "test_tool"},
    )
    crud.create_tool_definition(session=db, tool_definition=tool_def)

    # Create a user for the tool instance
    user = create_random_user(db)

    tool_data = ToolInstanceCreate(
        definition_id=tool_def.id,
        status=ToolInstanceStatus.ACTIVE,
        owner_id=user.id,
        app_id=tool_def.app_id,
    )
    tool_instance = crud.create_tool_instance(session=db, tool_instance=tool_data)
    response = client.get(
        f"{settings.API_V1_STR}/tool-instances/{tool_instance.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == tool_instance.id
    assert content["definitionId"] == tool_data.definition_id
    assert content["status"] == ToolInstanceStatus.ACTIVE
    assert content["ownerId"] == user.id
    assert content["appId"] == tool_data.app_id
    assert content["createdAt"] is not None
    assert content["updatedAt"] is not None


def test_read_tool_instance_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/tool-instances/{random_string()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Tool instance not found"


def test_read_tool_instances(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # First create a tool definition
    tool_def = ToolDefinition(
        app_id=random_string(),
        tool_schema={"type": "object", "properties": {}},
        tool_metadata={"name": "test_tool"},
    )
    crud.create_tool_definition(session=db, tool_definition=tool_def)

    # Get the user
    user = crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)

    tool_data1 = ToolInstanceCreate(
        definition_id=tool_def.id,
        status=ToolInstanceStatus.ACTIVE,
        owner_id=user.id,
        app_id=tool_def.app_id,
    )
    tool_data2 = ToolInstanceCreate(
        definition_id=tool_def.id,
        status=ToolInstanceStatus.ACTIVE,
        owner_id=user.id,
        app_id=tool_def.app_id,
    )
    crud.create_tool_instance(session=db, tool_instance=tool_data1)
    crud.create_tool_instance(session=db, tool_instance=tool_data2)
    response = client.get(
        f"{settings.API_V1_STR}/tool-instances/",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2
    assert content["count"] >= 2
    for item in content["data"]:
        assert item["ownerId"] == user.id
        assert item["appId"] == tool_def.app_id


def test_update_tool_instance(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # First create a tool definition
    tool_def = ToolDefinition(
        app_id=random_string(),
        tool_schema={"type": "object", "properties": {}},
        tool_metadata={"name": "test_tool"},
    )
    crud.create_tool_definition(session=db, tool_definition=tool_def)

    # Get the user
    user = crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)

    tool_data = ToolInstanceCreate(
        definition_id=tool_def.id,
        status=ToolInstanceStatus.ACTIVE,
        owner_id=user.id,
        app_id=tool_def.app_id,
    )
    tool_instance = crud.create_tool_instance(session=db, tool_instance=tool_data)
    update_data = ToolInstanceUpdate(status=ToolInstanceStatus.INACTIVE)
    response = client.put(
        f"{settings.API_V1_STR}/tool-instances/{tool_instance.id}",
        headers=normal_user_token_headers,
        json=update_data.model_dump(exclude_unset=True),
    )
    assert response.status_code == 200
    content = response.json()
    assert content["status"] == ToolInstanceStatus.INACTIVE
    assert content["ownerId"] == user.id
    assert content["appId"] == tool_def.app_id
    assert content["updatedAt"] is not None


def test_update_tool_instance_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    update_data = ToolInstanceUpdate(status=ToolInstanceStatus.INACTIVE)
    response = client.put(
        f"{settings.API_V1_STR}/tool-instances/{random_string()}",
        headers=superuser_token_headers,
        json=update_data.model_dump(exclude_unset=True),
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Tool instance not found"


def test_delete_tool_instance(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # First create a tool definition
    tool_def = ToolDefinition(
        app_id=random_string(),
        tool_schema={"type": "object", "properties": {}},
        tool_metadata={"name": "test_tool"},
    )
    crud.create_tool_definition(session=db, tool_definition=tool_def)

    # Get the user
    user = crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)

    tool_data = ToolInstanceCreate(
        definition_id=tool_def.id,
        status=ToolInstanceStatus.ACTIVE,
        owner_id=user.id,
        app_id=tool_def.app_id,
    )
    tool_instance = crud.create_tool_instance(session=db, tool_instance=tool_data)
    response = client.delete(
        f"{settings.API_V1_STR}/tool-instances/{tool_instance.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Tool instance deleted successfully"

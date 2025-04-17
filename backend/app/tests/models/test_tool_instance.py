from unittest.mock import patch

import pytest
from sqlmodel import Session, delete

from app.core.security import get_password_hash
from app.models import (
    MCPInstance,
    ToolInstance,
    ToolInstanceStatus,
    User,
)
from app.services.tool_registration import ToolRegistrationService
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
    db: Session, user: User, mcp_instance: MCPInstance, tool_instance_data: dict
):
    """Test creating a tool instance."""
    instance = ToolInstance(
        **tool_instance_data,
        owner_id=user.id,
        mcp_instance_id=mcp_instance.id,
    )
    db.add(instance)
    db.commit()
    db.refresh(instance)

    assert instance.id is not None
    assert instance.status == tool_instance_data["status"]
    assert instance.config == tool_instance_data["config"]
    assert instance.tool_schema == tool_instance_data["tool_schema"]
    assert instance.tool_metadata == tool_instance_data["tool_metadata"]
    assert instance.owner_id == user.id
    assert instance.mcp_instance_id == mcp_instance.id
    assert instance.created_at is not None
    assert instance.updated_at is not None


def test_update_tool_instance(db: Session, tool_instance: ToolInstance):
    """Test updating a tool instance."""
    new_config = {"updated": "value"}
    new_status = ToolInstanceStatus.INACTIVE

    tool_instance.config = new_config
    tool_instance.status = new_status
    db.add(tool_instance)
    db.commit()
    db.refresh(tool_instance)

    assert tool_instance.config == new_config
    assert tool_instance.status == new_status


def test_delete_tool_instance(db: Session, tool_instance: ToolInstance):
    """Test deleting a tool instance."""
    db.delete(tool_instance)
    db.commit()

    # Verify instance is deleted
    result = db.get(ToolInstance, tool_instance.id)
    assert result is None


def test_tool_instance_relationships(
    tool_instance: ToolInstance, user: User, mcp_instance: MCPInstance
):
    """Test tool instance relationships."""
    assert tool_instance.owner_id == user.id
    assert tool_instance.mcp_instance_id == mcp_instance.id


@patch.object(ToolRegistrationService, "sync_registration_state")
def test_tool_registration_on_create(
    mock_sync,
    db: Session,
    user: User,
    mcp_instance: MCPInstance,
    tool_instance_data: dict,
):
    """Test tool registration on instance creation."""
    instance = ToolInstance(
        **tool_instance_data,
        owner_id=user.id,
        mcp_instance_id=mcp_instance.id,
    )
    db.add(instance)
    db.commit()

    # Verify registration was called
    mock_sync.assert_called_once_with(
        instance.status,
        None,
        instance.tool_schema,
        instance.tool_metadata,
        instance.config,
    )


@patch.object(ToolRegistrationService, "sync_registration_state")
def test_tool_registration_on_status_change(
    mock_sync, db: Session, tool_instance: ToolInstance
):
    """Test tool registration on status change."""
    old_status = tool_instance.status
    new_status = ToolInstanceStatus.INACTIVE

    tool_instance.status = new_status
    db.add(tool_instance)
    db.commit()

    # Verify registration was called with old and new status
    mock_sync.assert_called_once_with(
        new_status,
        old_status,
        tool_instance.tool_schema,
        tool_instance.tool_metadata,
        tool_instance.config,
    )

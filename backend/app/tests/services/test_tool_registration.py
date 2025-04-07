from unittest.mock import MagicMock, patch

import pytest
from sqlmodel import Session

from app.models import ToolDefinition, ToolInstance
from app.models.tool_instance import ToolInstanceStatus
from app.services.tool_registration import ToolRegistrationService


@pytest.fixture
def mock_session():
    """Create a mock session for testing."""
    return MagicMock(spec=Session)


@pytest.fixture
def mock_active_tool_instances():
    """Create mock tool instances for testing."""
    # Create two active tool instances
    instance1 = ToolInstance(
        id="inst1",
        definition_id="def1",
        status=ToolInstanceStatus.ACTIVE,
        owner_id="user1",
        app_id="app1",
        config={"key": "value1"},
    )

    instance2 = ToolInstance(
        id="inst2",
        definition_id="def2",
        status=ToolInstanceStatus.ACTIVE,
        owner_id="user1",
        app_id="app1",
        config={"key": "value2"},
    )

    # Create definitions for the instances
    definition1 = ToolDefinition(
        id="def1",
        app_id="app1",
        tool_schema={"name": "tool1", "description": "Test tool 1"},
        tool_metadata={"path": "/test1", "method": "GET"},
    )

    definition2 = ToolDefinition(
        id="def2",
        app_id="app1",
        tool_schema={"name": "tool2", "description": "Test tool 2"},
        tool_metadata={"path": "/test2", "method": "POST"},
    )

    # Associate definitions with instances
    instance1.definition = definition1
    instance2.definition = definition2

    return [instance1, instance2]


@patch("app.services.tool_registration.register_tool")
@patch("app.services.tool_registration.schema_to_function")
def test_load_active_tool_instances(
    mock_schema_to_function,
    mock_register_tool,
    mock_session,
    mock_active_tool_instances,
):
    """Test loading active tool instances during startup."""
    # Configure the session to return our mock instances
    mock_session.exec.return_value.all.return_value = mock_active_tool_instances

    # Configure schema_to_function to return a simple function
    mock_schema_to_function.side_effect = (
        lambda schema, metadata, config: lambda: f"Tool {schema['name']}"
    )

    # Call the method we're testing
    ToolRegistrationService.load_active_tool_instances(mock_session)

    # Verify the session executed a query with the right conditions
    mock_session.exec.assert_called_once()

    # Verify schema_to_function was called twice (once for each active instance)
    assert mock_schema_to_function.call_count == 2

    # Verify schema_to_function was called with the right arguments
    mock_schema_to_function.assert_any_call(
        {"name": "tool1", "description": "Test tool 1"},
        {"path": "/test1", "method": "GET"},
        {"key": "value1"},
    )
    mock_schema_to_function.assert_any_call(
        {"name": "tool2", "description": "Test tool 2"},
        {"path": "/test2", "method": "POST"},
        {"key": "value2"},
    )

    # Verify register_tool was called twice
    assert mock_register_tool.call_count == 2

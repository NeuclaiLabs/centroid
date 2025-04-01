import json
from unittest.mock import AsyncMock, patch

import pytest

from app.mcp.openapi.executor import (
    EndpointConfig,
    execute_endpoint,
    translate_fn_to_endpoint,
)
from app.mcp.openapi.schema_to_func import create_dynamic_function_from_schema

# Simplified GitHub schema with only parameters
github_schema = {
    "title": "GetGitHubIssues",
    "description": "Parameters for fetching GitHub issues via REST API",
    "type": "object",
    "properties": {
        "owner": {
            "type": "string",
            "description": "The account owner of the repository",
            "x-category": "parameters",
        },
        "repo": {
            "type": "string",
            "description": "The name of the repository",
            "x-category": "parameters",
        },
        "state": {
            "type": "string",
            "enum": ["open", "closed", "all"],
            "default": "open",
            "description": "Indicates the state of issues to return",
            "x-category": "parameters",
        },
    },
    "required": ["owner", "repo"],
}


@pytest.fixture
def github_function():
    return create_dynamic_function_from_schema(github_schema)


def test_translate_fn_to_endpoint_basic(github_function):
    """Test basic translation of function to endpoint configuration with required fields."""
    # Set required fields to pass validation
    github_function.owner = "microsoft"
    github_function.repo = "typescript"

    config = translate_fn_to_endpoint(
        base_url="https://api.github.com",
        method="GET",
        path="/repos/{owner}/{repo}/issues",
        connection="test_connection",
        fn=github_function,
    )

    assert isinstance(config, EndpointConfig)
    assert config.url == "https://api.github.com/repos/{owner}/{repo}/issues"
    assert config.method == "GET"
    assert config.timeout == 30.0
    # Should include required params and default value
    assert config.params == {
        "owner": "microsoft",
        "repo": "typescript",
        "state": "open",  # Default value should be included
    }


def test_translate_fn_with_required_parameters(github_function):
    """Test translation with only required parameters."""
    github_function.owner = "microsoft"
    github_function.repo = "typescript"

    config = translate_fn_to_endpoint(
        base_url="https://api.github.com",
        method="GET",
        path="/repos/{owner}/{repo}/issues",
        connection="test_connection",
        fn=github_function,
    )

    # Should include required params and default value
    assert config.params == {
        "owner": "microsoft",
        "repo": "typescript",
        "state": "open",  # Default value should be included
    }
    assert config.headers is None
    assert config.body is None


def test_translate_fn_with_optional_parameter(github_function):
    """Test translation with optional parameter override."""
    github_function.owner = "microsoft"
    github_function.repo = "typescript"
    github_function.state = "closed"  # Override default value

    config = translate_fn_to_endpoint(
        base_url="https://api.github.com",
        method="GET",
        path="/repos/{owner}/{repo}/issues",
        connection="test_connection",
        fn=github_function,
    )

    assert config.params == {
        "owner": "microsoft",
        "repo": "typescript",
        "state": "closed",  # Overridden value should be used instead of default
    }


def test_translate_fn_with_default_parameter(github_function):
    """Test translation with default parameter value."""
    github_function.owner = "microsoft"
    github_function.repo = "typescript"
    # Not setting state should use the default value

    config = translate_fn_to_endpoint(
        base_url="https://api.github.com",
        method="GET",
        path="/repos/{owner}/{repo}/issues",
        connection="test_connection",
        fn=github_function,
    )

    # Should include required params and default value
    assert config.params == {
        "owner": "microsoft",
        "repo": "typescript",
        "state": "open",  # Default value should be included
    }


@pytest.mark.asyncio
async def test_execute_endpoint_success():
    """Test successful endpoint execution."""
    response_data = {"id": 1, "title": "Test Issue"}
    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.text = json.dumps(response_data)
    # Mock json as a regular method, not a coroutine
    mock_response.json = lambda: response_data

    config = EndpointConfig(
        url="https://api.github.com/repos/test/test/issues",
        method="GET",
        params={"state": "open"},
    )

    # Create a mock client instance
    mock_client_instance = AsyncMock()
    mock_client_instance.request.return_value = mock_response

    # Mock the AsyncClient class
    with patch("httpx.AsyncClient") as mock_client:
        # Configure the mock to return our mock instance
        mock_client.return_value = mock_client_instance
        mock_client.return_value.__aenter__.return_value = mock_client_instance

        response = await execute_endpoint(config)

        # Verify the request was made with correct parameters
        mock_client_instance.request.assert_called_once_with(
            method="GET",
            url="https://api.github.com/repos/test/test/issues",
            headers=None,
            params={"state": "open"},
            json=None,
        )

    assert response.status_code == 200
    assert response.data == response_data
    assert response.error is None


@pytest.mark.asyncio
async def test_execute_endpoint_error():
    """Test endpoint execution with error response."""
    error_data = {"message": "Not Found"}
    mock_response = AsyncMock()
    mock_response.status_code = 404
    mock_response.text = json.dumps(error_data)
    # Mock json as a regular method, not a coroutine
    mock_response.json = lambda: error_data

    config = EndpointConfig(
        url="https://api.github.com/repos/test/test/issues", method="GET"
    )

    # Create a mock client instance
    mock_client_instance = AsyncMock()
    mock_client_instance.request.return_value = mock_response

    # Mock the AsyncClient class
    with patch("httpx.AsyncClient") as mock_client:
        # Configure the mock to return our mock instance
        mock_client.return_value = mock_client_instance
        mock_client.return_value.__aenter__.return_value = mock_client_instance

        response = await execute_endpoint(config)

        # Verify the request was made with correct parameters
        mock_client_instance.request.assert_called_once_with(
            method="GET",
            url="https://api.github.com/repos/test/test/issues",
            headers=None,
            params=None,
            json=None,
        )

    assert response.status_code == 404
    assert response.data is None
    assert response.error == json.dumps(error_data)


def test_translate_fn_invalid_function():
    """Test translation with invalid function (no model attribute)."""

    def invalid_fn():
        pass

    with pytest.raises(ValueError, match="Function must have a model attribute"):
        translate_fn_to_endpoint(
            base_url="https://api.github.com",
            method="GET",
            path="/test",
            connection="test_connection",
            fn=invalid_fn,
        )

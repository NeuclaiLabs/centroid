import json
from unittest.mock import AsyncMock, patch

import pytest
from pydantic.fields import PydanticUndefined

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


@pytest.mark.asyncio
async def test_translate_fn_parameters(github_function):
    """Test function translation with different parameter scenarios."""
    # Test with required parameters
    config = translate_fn_to_endpoint(
        base_url="https://api.github.com",
        method="GET",
        path="/repos/{owner}/{repo}/issues",
        connection="test_connection",
        fn=github_function,
    )

    # Verify basic configuration
    assert isinstance(config, EndpointConfig)
    assert config.url == "https://api.github.com/repos/{owner}/{repo}/issues"
    assert config.method == "GET"
    assert config.timeout == 30.0
    assert config.headers is None
    assert config.body is None

    # Verify default parameters
    params = config.params
    assert params["owner"] is PydanticUndefined
    assert params["repo"] is PydanticUndefined
    assert params["state"] == "open"

    # Set runtime arguments and verify they're used in translation
    github_function.__bound_args__ = {
        "owner": "microsoft",
        "repo": "typescript",
        "state": "closed",
    }

    config = translate_fn_to_endpoint(
        base_url="https://api.github.com",
        method="GET",
        path="/repos/{owner}/{repo}/issues",
        connection="test_connection",
        fn=github_function,
    )

    # Verify parameters with runtime values
    assert config.params == {
        "owner": "microsoft",
        "repo": "typescript",
        "state": "closed",  # Overridden value
    }


@pytest.mark.asyncio
async def test_execute_endpoint_responses():
    """Test endpoint execution with success and error responses."""
    # Test successful response
    success_data = {"id": 1, "title": "Test Issue"}
    success_response = AsyncMock(
        status_code=200,
        text=json.dumps(success_data),
        json=lambda: success_data,
    )

    # Test error response
    error_data = {"message": "Not Found"}
    error_response = AsyncMock(
        status_code=404,
        text=json.dumps(error_data),
        json=lambda: error_data,
    )

    configs = [
        (
            EndpointConfig(
                url="https://api.github.com/repos/test/test/issues",
                method="GET",
                params={"state": "open"},
            ),
            success_response,
            {"state": "open"},
        ),
        (
            EndpointConfig(
                url="https://api.github.com/repos/test/test/issues",
                method="GET",
            ),
            error_response,
            None,
        ),
    ]

    for config, mock_response, expected_params in configs:
        mock_client_instance = AsyncMock()
        mock_client_instance.request.return_value = mock_response

        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value = mock_client_instance
            mock_client.return_value.__aenter__.return_value = mock_client_instance

            response = await execute_endpoint(config)

            mock_client_instance.request.assert_called_once_with(
                method="GET",
                url="https://api.github.com/repos/test/test/issues",
                headers=None,
                params=expected_params,
                json=None,
            )

            if mock_response.status_code == 200:
                assert response.status_code == 200
                assert response.data == success_data
                assert response.error is None
            else:
                assert response.status_code == 404
                assert response.data is None
                assert response.error == json.dumps(error_data)


def test_translate_fn_validation():
    """Test function translation validation."""

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

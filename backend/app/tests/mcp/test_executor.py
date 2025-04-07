import json
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from pydantic import BaseModel

from app.mcp.openapi.executor import (
    EndpointConfig,
    execute_endpoint,
    translate_fn_to_endpoint,
)
from app.mcp.openapi.schema_to_func import schema_to_function


class TestModel(BaseModel):
    """Test model for validation testing."""

    test_field: str = "test"


# Test schemas
@pytest.fixture
def github_schema() -> tuple[dict[str, Any], dict[str, Any]]:
    """GitHub list issues schema and metadata fixture"""
    schema = {
        "name": "ListGitHubIssues",
        "title": "ListGitHubIssues",
        "description": "Parameters for fetching GitHub issues via REST API",
        "type": "object",
        "properties": {
            "owner": {
                "type": "string",
                "description": "The account owner of the repository",
            },
            "repo": {"type": "string", "description": "The name of the repository"},
            "state": {
                "type": "string",
                "enum": ["open", "closed", "all"],
                "default": "open",
                "description": "Indicates the state of issues to return",
            },
            "assignee": {
                "type": "string",
                "description": "Filter issues by assignee. Can be 'none' for unassigned issues",
            },
            "creator": {"type": "string", "description": "Filter issues by creator"},
            "mentioned": {
                "type": "string",
                "description": "Filter issues by user mentioned in them",
            },
            "labels": {
                "type": "string",
                "description": "Comma-separated list of label names",
            },
            "sort": {
                "type": "string",
                "enum": ["created", "updated", "comments"],
                "default": "created",
                "description": "What to sort results by",
            },
            "direction": {
                "type": "string",
                "enum": ["asc", "desc"],
                "default": "desc",
                "description": "The direction of the sort",
            },
            "since": {
                "type": "string",
                "format": "date-time",
                "description": "Only show issues updated at or after this time",
            },
            "per_page": {
                "type": "integer",
                "default": 30,
                "description": "Number of results per page",
            },
            "page": {
                "type": "integer",
                "default": 1,
                "description": "Page number of the results",
            },
        },
        "required": ["owner", "repo"],
    }

    metadata = {
        "path": "/repos/{owner}/{repo}/issues",
        "method": "GET",
        "tags": ["issues", "list", "query"],
        "owner": {"type": "parameter", "in": "path"},
        "repo": {"type": "parameter", "in": "path"},
        "state": {"type": "parameter", "in": "query"},
        "assignee": {"type": "parameter", "in": "query"},
        "creator": {"type": "parameter", "in": "query"},
        "mentioned": {"type": "parameter", "in": "query"},
        "labels": {"type": "parameter", "in": "query"},
        "sort": {"type": "parameter", "in": "query"},
        "direction": {"type": "parameter", "in": "query"},
        "since": {"type": "parameter", "in": "query"},
        "per_page": {"type": "parameter", "in": "query"},
        "page": {"type": "parameter", "in": "query"},
    }
    return schema, metadata


@pytest.fixture
def github_function():
    return schema_to_function(github_schema)


@pytest.mark.asyncio
async def test_translate_fn_parameters(github_schema):
    """Test function translation with different parameter scenarios."""
    schema, metadata = github_schema
    fn = schema_to_function(schema, metadata)

    # Create a model instance with required parameters
    model_instance = fn.model(
        owner="microsoft",
        repo="typescript",
        state="closed",
    )

    # Test with model instance
    config = translate_fn_to_endpoint(
        metadata=metadata,
        connection=None,
        fn=fn,
        model_instance=model_instance,
    )

    # Verify basic configuration
    assert isinstance(config, EndpointConfig)
    assert config.url.endswith("/repos/microsoft/typescript/issues")
    assert config.method == "GET"
    assert config.timeout == 30.0
    assert config.headers is None
    assert config.body is None

    # Verify parameters (including defaults)
    expected_params = {
        "state": "closed",
        "direction": "desc",  # default value
        "sort": "created",  # default value
        "per_page": 30,  # default value
        "page": 1,  # default value
    }
    assert config.params == expected_params

    # Test with different model instance and explicit values
    model_instance2 = fn.model(
        owner="facebook",
        repo="react",
        state="open",
        labels="bug",
        assignee="octocat",
        direction="asc",
        sort="updated",
        per_page=50,
        page=2,
    )

    config = translate_fn_to_endpoint(
        metadata=metadata,
        connection=None,
        fn=fn,
        model_instance=model_instance2,
    )

    # Verify parameters with different values
    assert config.url.endswith("/repos/facebook/react/issues")
    expected_params = {
        "state": "open",
        "labels": "bug",
        "assignee": "octocat",
        "direction": "asc",
        "sort": "updated",
        "per_page": 50,
        "page": 2,
    }
    assert config.params == expected_params


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
            metadata={},
            connection=None,
            fn=invalid_fn,
            model_instance=TestModel(test_field="test"),
        )

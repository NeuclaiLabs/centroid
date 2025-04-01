from datetime import datetime

import pytest
from pydantic import ValidationError
from pydantic.fields import FieldInfo

from app.mcp.openapi.schema_to_func import create_dynamic_function_from_schema

# Test schemas
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
        "created_at": {
            "type": "string",
            "format": "date-time",
            "description": "Creation timestamp",
            "x-category": "parameters",
        },
        "labels": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of label names",
            "x-category": "parameters",
        },
        "payload": {
            "type": "object",
            "description": "The request payload",
            "x-category": "body",
            "properties": {"title": {"type": "string"}, "body": {"type": "string"}},
        },
    },
    "required": ["owner", "repo"],
}


@pytest.mark.asyncio
async def test_basic_validation():
    get_github_issues = create_dynamic_function_from_schema(github_schema)

    # Test valid input
    await get_github_issues(owner="microsoft", repo="typescript", state="open")
    assert get_github_issues.__bound_args__["owner"] == "microsoft"
    assert get_github_issues.__bound_args__["repo"] == "typescript"
    assert get_github_issues.__bound_args__["state"] == "open"

    # Test with minimal required fields
    await get_github_issues(owner="microsoft", repo="typescript")
    assert get_github_issues.__bound_args__["owner"] == "microsoft"
    assert get_github_issues.__bound_args__["repo"] == "typescript"
    assert (
        get_github_issues.__bound_args__["state"] == "open"
    )  # Should use default value


@pytest.mark.asyncio
async def test_required_fields():
    get_github_issues = create_dynamic_function_from_schema(github_schema)

    # Test missing required field
    with pytest.raises(ValidationError):
        await get_github_issues(owner="microsoft")


@pytest.mark.asyncio
async def test_enum_validation():
    get_github_issues = create_dynamic_function_from_schema(github_schema)

    # Test invalid enum value
    with pytest.raises(ValidationError):
        await get_github_issues(
            owner="microsoft", repo="typescript", state="invalid_state"
        )


@pytest.mark.asyncio
async def test_datetime_field():
    get_github_issues = create_dynamic_function_from_schema(github_schema)

    # Test valid datetime
    model = get_github_issues.model(
        owner="microsoft", repo="typescript", created_at="2023-01-01T00:00:00Z"
    )
    assert isinstance(model.created_at, datetime)

    # Test invalid datetime
    with pytest.raises(ValidationError):
        get_github_issues.model(
            owner="microsoft", repo="typescript", created_at="invalid_date"
        )


@pytest.mark.asyncio
async def test_array_field():
    get_github_issues = create_dynamic_function_from_schema(github_schema)

    # Test valid array
    await get_github_issues(
        owner="microsoft", repo="typescript", labels=["bug", "feature"]
    )
    assert get_github_issues.__bound_args__["labels"] == ["bug", "feature"]

    # Test with empty array
    await get_github_issues(owner="microsoft", repo="typescript", labels=[])
    assert get_github_issues.__bound_args__["labels"] == []


def test_function_metadata():
    get_github_issues = create_dynamic_function_from_schema(github_schema)

    # Test function name
    assert get_github_issues.__name__ == "GetGitHubIssues"

    # Test model attachment
    assert hasattr(get_github_issues, "model")

    # Test function signature
    assert hasattr(get_github_issues, "__signature__")
    params = get_github_issues.__signature__.parameters
    assert "owner" in params
    assert "repo" in params
    assert "state" in params
    assert "created_at" in params
    assert "labels" in params


def test_metadata_preservation():
    """Test that metadata is properly preserved in json_schema_extra."""
    # Schema with various metadata fields
    test_schema = {
        "title": "TestMetadata",
        "description": "Test schema with metadata",
        "type": "object",
        "properties": {
            "field_with_metadata": {
                "type": "string",
                "description": "Field with rich metadata",
                "title": "Custom Title",
                "x-category": "custom_category",
                "x-custom-field": "custom value",
                "examples": ["example1", "example2"],
                "deprecated": True,
            },
            "field_with_defaults": {
                "type": "string",
                "description": "Field with default metadata",
            },
        },
        "required": ["field_with_metadata"],
    }

    test_func = create_dynamic_function_from_schema(test_schema)
    model_fields = test_func.model.model_fields
    params = list(test_func.__signature__.parameters.values())

    # Test model field metadata
    field_with_metadata = model_fields["field_with_metadata"]
    assert field_with_metadata.description == "Field with rich metadata"
    assert field_with_metadata.title == "Custom Title"

    # Test json_schema_extra content
    extra = field_with_metadata.json_schema_extra
    assert extra["x-category"] == "custom_category"
    assert extra["x-custom-field"] == "custom value"
    assert extra["examples"] == ["example1", "example2"]
    assert extra["deprecated"] is True

    # Test default metadata handling
    field_with_defaults = model_fields["field_with_defaults"]
    assert field_with_defaults.description == "Field with default metadata"
    assert (
        field_with_defaults.title == "field_with_defaults"
    )  # Should use field name as title
    assert (
        field_with_defaults.json_schema_extra["x-category"] == "body"
    )  # Should use default category

    # Test parameter metadata preservation
    param_with_metadata = next(p for p in params if p.name == "field_with_metadata")
    assert isinstance(param_with_metadata.default, FieldInfo)
    assert param_with_metadata.default.description == "Field with rich metadata"
    assert param_with_metadata.default.title == "Custom Title"
    assert (
        param_with_metadata.default.json_schema_extra["x-category"] == "custom_category"
    )
    assert (
        param_with_metadata.default.json_schema_extra["x-custom-field"]
        == "custom value"
    )


def test_nested_metadata():
    """Test that metadata is preserved for nested object fields."""
    nested_schema = {
        "title": "TestNestedMetadata",
        "type": "object",
        "properties": {
            "nested_object": {
                "type": "object",
                "description": "A nested object with metadata",
                "title": "Nested Object",
                "x-category": "nested",
                "properties": {
                    "nested_field": {
                        "type": "string",
                        "description": "Nested field description",
                        "title": "Nested Field",
                        "examples": ["example value"],
                        "deprecated": True,
                    }
                },
            }
        },
    }

    test_func = create_dynamic_function_from_schema(nested_schema)
    model_fields = test_func.model.model_fields
    print("Model fields: ", model_fields)

    # Test nested object metadata
    nested_field = model_fields["nested_object"]
    assert nested_field.description == "A nested object with metadata"
    assert nested_field.title == "Nested Object"
    assert nested_field.json_schema_extra["x-category"] == "nested"

    # Test nested field metadata in the generated model
    nested_model = nested_field.annotation.__args__[0]  # Get actual model from Optional
    print("Actual nested model: ", nested_model)
    print("Actual nested model fields: ", nested_model.model_fields)

    nested_model_field = nested_model.model_fields["nested_field"]
    assert nested_model_field.description == "Nested field description"
    assert nested_model_field.title == "Nested Field"
    assert nested_model_field.json_schema_extra["examples"] == ["example value"]
    assert nested_model_field.json_schema_extra["deprecated"] is True


if __name__ == "__main__":
    pytest.main([__file__])

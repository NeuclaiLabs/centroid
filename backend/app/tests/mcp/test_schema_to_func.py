from typing import Any

import pytest
from pydantic import BaseModel
from pydantic.fields import FieldInfo, PydanticUndefined

from app.mcp.openapi.schema_to_func import schema_to_function


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
def gmail_schema() -> tuple[dict[str, Any], dict[str, Any]]:
    """Gmail send email schema and metadata fixture"""
    return {
        "name": "SendEmail",
        "description": "Send an email to specified recipients with subject and body content",
        "parameters": {
            "type": "object",
            "properties": {
                "to": {
                    "type": "string",
                    "description": "Email address(es) of recipients (comma-separated for multiple recipients)",
                },
                "cc": {
                    "type": "string",
                    "description": "Email address(es) to CC (comma-separated for multiple recipients)",
                },
                "subject": {
                    "type": "string",
                    "description": "Subject line of the email",
                },
                "body": {"type": "string", "description": "Content of the email body"},
                "is_html": {
                    "type": "boolean",
                    "default": False,
                    "description": "Whether the body content is HTML formatted",
                },
            },
            "required": ["to", "subject", "body"],
        },
    }, {
        "path": "/gmail/v1/users/me/messages/send",
        "method": "POST",
        "to": {"type": "parameter", "in": "body"},
        "cc": {"type": "parameter", "in": "body"},
        "subject": {"type": "parameter", "in": "body"},
        "body": {"type": "parameter", "in": "body"},
        "is_html": {"type": "parameter", "in": "body"},
    }


@pytest.fixture
def calendar_schema() -> tuple[dict[str, Any], dict[str, Any]]:
    """Google Calendar create event schema and metadata fixture"""
    return {
        "name": "CreateEvent",
        "description": "Create a calendar event with specified details and attendees",
        "parameters": {
            "type": "object",
            "properties": {
                "summary": {"type": "string", "description": "Title of the event"},
                "start": {
                    "type": "object",
                    "properties": {
                        "dateTime": {
                            "type": "string",
                            "format": "date-time",
                            "description": "Start time of the event (ISO 8601 format)",
                        },
                        "timeZone": {
                            "type": "string",
                            "description": "Timezone for the start time",
                        },
                    },
                    "required": ["dateTime"],
                    "description": "Start time details",
                },
                "end": {
                    "type": "object",
                    "properties": {
                        "dateTime": {
                            "type": "string",
                            "format": "date-time",
                            "description": "End time of the event (ISO 8601 format)",
                        },
                        "timeZone": {
                            "type": "string",
                            "description": "Timezone for the end time",
                        },
                    },
                    "required": ["dateTime"],
                    "description": "End time details",
                },
                "attendees": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "email": {
                                "type": "string",
                                "format": "email",
                                "description": "Email address of the attendee",
                            },
                            "optional": {
                                "type": "boolean",
                                "default": False,
                                "description": "Whether attendance is optional",
                            },
                        },
                        "required": ["email"],
                    },
                    "description": "List of event attendees",
                },
            },
            "required": ["summary", "start", "end"],
        },
    }, {
        "path": "/calendar/v3/calendars/{calendar_id}/events",
        "method": "POST",
        "summary": {"type": "parameter", "in": "body"},
        "start": {"type": "parameter", "in": "body"},
        "end": {"type": "parameter", "in": "body"},
        "attendees": {"type": "parameter", "in": "body"},
    }


@pytest.fixture
def openai_schema() -> tuple[dict[str, Any], dict[str, Any]]:
    """OpenAI create embedding schema and metadata fixture"""
    return {
        "name": "CreateEmbedding",
        "description": "Generate embeddings for provided text content",
        "parameters": {
            "type": "object",
            "properties": {
                "model": {
                    "type": "string",
                    "default": "text-embedding-ada-002",
                    "description": "ID of the model to use",
                },
                "input": {
                    "oneOf": [
                        {"type": "string"},
                        {"type": "array", "items": {"type": "string"}},
                    ],
                    "description": "Input text to get embeddings for",
                },
                "dimensions": {
                    "type": "integer",
                    "description": "The number of dimensions for output embeddings",
                },
            },
            "required": ["model", "input"],
        },
    }, {
        "path": "/v1/embeddings",
        "method": "POST",
        "model": {"type": "parameter", "in": "body"},
        "input": {"type": "parameter", "in": "body"},
        "dimensions": {"type": "parameter", "in": "body"},
    }


class TestSchemaToFunction:
    """Test suite for schema to function conversion"""

    def test_gmail_signature_inspection(
        self, gmail_schema: tuple[dict[str, Any], dict[str, Any]]
    ):
        """Test Gmail schema function signature inspection"""
        schema, metadata = gmail_schema
        send_email = schema_to_function(schema, metadata)

        # Test function metadata
        assert send_email.__name__ == "SendEmail"
        assert (
            send_email.__doc__
            == "Send an email to specified recipients with subject and body content"
        )

        # Test signature parameters
        params = send_email.__signature__.parameters
        assert "to" in params
        assert "subject" in params
        assert "body" in params
        assert "is_html" in params
        assert "cc" in params

        # Test parameter metadata
        to_param = params["to"]
        assert isinstance(to_param.default, FieldInfo)
        assert (
            to_param.default.description
            == "Email address(es) of recipients (comma-separated for multiple recipients)"
        )

        # Test required vs optional parameters
        assert params["to"].default.default is PydanticUndefined  # Required
        assert params["subject"].default.default is PydanticUndefined  # Required
        assert params["body"].default.default is PydanticUndefined  # Required
        assert params["is_html"].default.default is False  # Optional with default
        assert params["cc"].default.default is None  # Optional without default

    def test_calendar_nested_signature(
        self, calendar_schema: tuple[dict[str, Any], dict[str, Any]]
    ):
        """Test Calendar schema nested object signature inspection"""
        schema, metadata = calendar_schema
        create_event = schema_to_function(schema, metadata)

        # Test function metadata
        assert create_event.__name__ == "CreateEvent"
        assert (
            create_event.__doc__
            == "Create a calendar event with specified details and attendees"
        )

        # Test model fields for nested structures
        fields = create_event.model.model_fields

        # Check start field structure
        start_field = fields["start"]
        assert issubclass(start_field.annotation, BaseModel)
        start_model = start_field.annotation
        assert "dateTime" in start_model.model_fields
        assert "timeZone" in start_model.model_fields

        # Check attendees field structure
        attendees_field = fields["attendees"]
        assert "list[dict] | None" in str(attendees_field.annotation)

        # Test required fields
        assert fields["summary"].is_required()
        assert fields["start"].is_required()
        assert fields["end"].is_required()

    def test_openai_union_type_signature(
        self, openai_schema: tuple[dict[str, Any], dict[str, Any]]
    ):
        """Test OpenAI schema union type signature inspection"""
        schema, metadata = openai_schema
        create_embedding = schema_to_function(schema, metadata)

        # Test function metadata
        assert create_embedding.__name__ == "CreateEmbedding"
        assert (
            create_embedding.__doc__ == "Generate embeddings for provided text content"
        )

        # Test model fields for union types
        fields = create_embedding.model.model_fields

        # Check input field union type
        input_field = fields["input"]
        assert str(input_field.annotation) == "str | list[str]"

        # Test default values
        assert fields["model"].default == "text-embedding-ada-002"
        assert fields["dimensions"].default is None

        # Test required fields
        assert not fields["model"].is_required()
        assert fields["input"].is_required()
        assert not fields["dimensions"].is_required()

    def test_github_metadata_inspection(
        self, github_schema: tuple[dict[str, Any], dict[str, Any]]
    ):
        """Test GitHub schema metadata and parameter locations inspection"""
        schema, metadata = github_schema
        list_issues = schema_to_function(schema, metadata)

        # Test function metadata
        assert list_issues.__name__ == schema["name"]
        assert list_issues.__doc__ == schema["description"]

        # Test model configuration
        assert list_issues.model.model_config["arbitrary_types_allowed"] is True
        assert list_issues.model.model_config["json_schema_extra"] == metadata

        # Test parameter locations
        assert metadata["owner"]["in"] == "path"
        assert metadata["repo"]["in"] == "path"
        assert metadata["state"]["in"] == "query"
        assert metadata["assignee"]["in"] == "query"
        assert metadata["labels"]["in"] == "query"

        # Test path and method
        assert metadata["path"] == "/repos/{owner}/{repo}/issues"
        assert metadata["method"] == "GET"
        assert metadata["tags"] == ["issues", "list", "query"]

        # Test parameter types and defaults
        fields = list_issues.model.model_fields
        assert fields["owner"].annotation == str
        assert fields["repo"].annotation == str
        assert fields["state"].annotation == str
        assert fields["state"].default == "open"
        assert fields["per_page"].annotation == int
        assert fields["per_page"].default == 30
        assert fields["page"].annotation == int
        assert fields["page"].default == 1

        # Test optional fields
        assert fields["assignee"].annotation == str | None
        assert fields["creator"].annotation == str | None
        assert fields["mentioned"].annotation == str | None
        assert fields["labels"].annotation == str | None
        assert fields["since"].annotation == str | None

        # No need to test required fields here as they were tested in schema assertions above


if __name__ == "__main__":
    pytest.main(["-v", __file__])

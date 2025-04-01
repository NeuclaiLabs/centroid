from collections.abc import Callable
from datetime import datetime
from inspect import Parameter, Signature
from typing import Any, Literal, get_type_hints

from pydantic import BaseModel, Field, create_model
from pydantic.fields import FieldInfo, PydanticUndefined

from .executor import execute_dynamic_function


def get_field_constraints(schema: dict[str, Any]) -> dict[str, Any]:
    """Helper to extract all possible constraints from schema"""
    constraints = {
        # String constraints
        "min_length": schema.get("minLength"),
        "max_length": schema.get("maxLength"),
        "pattern": schema.get("pattern"),
        # Number constraints
        "gt": schema.get("exclusiveMinimum"),
        "ge": schema.get("minimum"),
        "lt": schema.get("exclusiveMaximum"),
        "le": schema.get("maximum"),
        "multiple_of": schema.get("multipleOf"),
        # Array constraints
        "min_items": schema.get("minItems"),
        "max_items": schema.get("maxItems"),
        "unique_items": schema.get("uniqueItems"),
    }
    return {k: v for k, v in constraints.items() if v is not None}


def create_field_metadata(schema: dict[str, Any]) -> dict[str, Any]:
    """Create clean field metadata from schema"""
    base_metadata = {
        "description": schema.get("description"),
        "title": schema.get("title"),
        "examples": schema.get("examples"),
        "deprecated": schema.get("deprecated", False),
    }

    # Filter out None values from base metadata
    base_metadata = {k: v for k, v in base_metadata.items() if v is not None}

    # Get all x- metadata including x-category
    extra_metadata = {
        key: value
        for key, value in schema.items()
        if key.startswith("x-") and value is not None
    }

    # Ensure x-category has a default value if not present
    if "x-category" not in extra_metadata:
        extra_metadata["x-category"] = "body"

    # Merge dictionaries using update instead of |
    merged_metadata = base_metadata.copy()
    merged_metadata.update(extra_metadata)

    return merged_metadata


def create_field(
    field_type: type,
    field_schema: dict[str, Any],
    field_name: str,
    is_required: bool,
    field_default: Any = None,
) -> tuple[type, Field]:
    """Create a Pydantic field with proper metadata and validation"""
    metadata = create_field_metadata(field_schema)
    constraints = get_field_constraints(field_schema)

    default_value = (
        field_default
        if field_default is not None
        else PydanticUndefined
        if is_required
        else None
    )

    return (
        field_type,
        Field(
            default=default_value,
            description=metadata.get("description", ""),
            title=metadata.get("title", field_name),
            json_schema_extra={
                k: v for k, v in metadata.items() if k not in ["description", "title"]
            },
            **constraints,
        ),
    )


def create_parameter(
    field_name: str,
    field: FieldInfo,
    type_hint: type,
    is_required: bool,
) -> Parameter:
    """Create an inspect.Parameter with proper configuration"""
    param_field = Field(
        default=PydanticUndefined if is_required else field.default,
        description=field.description,
        title=field.title,
        json_schema_extra=field.json_schema_extra,
    )

    return Parameter(
        field_name,
        Parameter.KEYWORD_ONLY,
        default=param_field,
        annotation=type_hint,
    )


def _get_pydantic_type(
    prop_schema: dict[str, Any],
    field_name: str = "",
    required: list[str] | None = None,
) -> tuple[type, Any]:
    """Maps JSON schema types to Python/Pydantic types and constraints"""
    type_mapping = {
        "string": (str, None),
        "integer": (int, None),
        "number": (float, None),
        "boolean": (bool, None),
        "array": (list, None),
        "object": (dict, None),
    }

    required = required or []
    schema_default = prop_schema.get("default")
    is_nullable = (
        isinstance(prop_schema.get("type"), list) and "null" in prop_schema["type"]
    ) or (schema_default is None and field_name not in required)

    # Handle special types
    if prop_schema.get("format") == "date-time":
        return (datetime | None if is_nullable else datetime, schema_default)

    if prop_schema.get("type") == "array" and "items" in prop_schema:
        item_type, _ = _get_pydantic_type(prop_schema["items"], field_name, required)
        array_type = list[item_type]
        return (array_type | None if is_nullable else array_type, schema_default)

    if prop_schema.get("type") == "object" and "properties" in prop_schema:
        required_fields = prop_schema.get("required", [])
        nested_fields = {}

        for nested_name, nested_schema in prop_schema["properties"].items():
            field_type, field_default = _get_pydantic_type(
                nested_schema, nested_name, required_fields
            )
            nested_fields[nested_name] = create_field(
                field_type,
                nested_schema,
                nested_name,
                nested_name in required_fields,
                field_default,
            )

        model_name = prop_schema.get("title", "NestedModel")
        model = create_model(
            model_name,
            __base__=BaseModel,
            __module__=__name__,
            model_config={
                "arbitrary_types_allowed": True,
                "extra": "allow"
                if prop_schema.get("additionalProperties", True)
                else "forbid",
                "json_schema_extra": create_field_metadata(prop_schema),
            },
            **nested_fields,
        )
        return (model | None if is_nullable else model, None)

    if "enum" in prop_schema:
        enum_type = Literal[tuple(prop_schema["enum"])]
        return (enum_type | None if is_nullable else enum_type, schema_default)

    if is_nullable:
        base_type = (
            next(t for t in prop_schema["type"] if t != "null")
            if isinstance(prop_schema.get("type"), list)
            else prop_schema.get("type", "string")
        )
        type_tuple, _ = type_mapping.get(base_type, (Any, None))
        return (type_tuple | None, schema_default)

    type_tuple, default = type_mapping.get(
        prop_schema.get("type", "string"), (Any, None)
    )
    return (type_tuple, schema_default if schema_default is not None else default)


def create_dynamic_function_from_schema(
    schema: dict[str, Any],
    # method: Literal["GET", "PUT", "DELETE", "POST", "PATCH"] = "GET",
    # path: str = "",
    connection: Any | None = None,
) -> Callable:
    """Creates a dynamic function based on a JSON schema using Pydantic for validation."""

    # Create model fields from properties
    field_definitions = {}
    required_fields = schema.get("required", [])

    for field_name, field_schema in schema.get("properties", {}).items():
        field_type, field_default = _get_pydantic_type(
            field_schema,
            field_name,
            required_fields,
        )
        field_definitions[field_name] = create_field(
            field_type,
            field_schema,
            field_name,
            field_name in required_fields,
            field_default,
        )

    # Create Pydantic model
    InputModel = create_model(
        schema.get("title", "DynamicModel"),
        __base__=BaseModel,
        __module__=__name__,
        model_config={"arbitrary_types_allowed": True},
        **field_definitions,
    )

    # Create parameters for function signature
    parameters = [
        create_parameter(
            field_name,
            field,
            get_type_hints(InputModel)[field_name],
            field_name in required_fields,
        )
        for field_name, field in InputModel.model_fields.items()
    ]

    async def dynamic_function(*args, **kwargs):
        bound_args = Signature(parameters=parameters, return_annotation=Any).bind(
            *args, **kwargs
        )
        bound_args.apply_defaults()

        # Clean arguments and create model instance
        cleaned_args = {
            name: value.default if isinstance(value, FieldInfo) else value
            for name, value in bound_args.arguments.items()
        }
        model_instance = InputModel(**cleaned_args)

        # Store bound arguments for endpoint configuration
        dynamic_function.__bound_args__ = cleaned_args

        return await execute_dynamic_function(
            model_instance, connection, dynamic_function
        )

    # Add metadata
    dynamic_function.__signature__ = Signature(
        parameters=parameters, return_annotation=Any
    )
    dynamic_function.__annotations__ = {p.name: p.annotation for p in parameters}
    dynamic_function.__name__ = schema.get("title", "dynamic_function")
    dynamic_function.model = InputModel

    return dynamic_function

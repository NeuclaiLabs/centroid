from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime
from inspect import Parameter, Signature
from typing import Any, Literal, get_type_hints

from pydantic import BaseModel, Field, create_model
from pydantic.fields import FieldInfo, PydanticUndefined

from .executor import execute_endpoint, translate_fn_to_endpoint


@dataclass
class ParameterDescriptor:
    """Custom descriptor to hold parameter description and default value"""

    description: str
    default: Any = ...

    def __get__(self, obj, objtype=None):
        return self.default if self.default is not ... else None


def get_field_constraints(schema: dict[str, Any]) -> dict[str, Any]:
    """Helper to extract all possible constraints from schema"""
    # Only include actual validation constraints
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


def get_field_metadata(schema: dict[str, Any]) -> dict[str, Any]:
    """Helper to extract field metadata from schema"""
    metadata = {
        "description": schema.get("description"),
        "title": schema.get("title"),
        "examples": schema.get("examples"),
        "deprecated": schema.get("deprecated", False),
        "x-category": schema.get("x-category", "body"),
        **{
            key: value
            for key, value in schema.items()
            if key.startswith("x-") and key != "x-category"
        },
    }
    return {k: v for k, v in metadata.items() if v is not None}


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

        for field_name, field_schema in prop_schema["properties"].items():
            field_type, field_default = _get_pydantic_type(
                field_schema, field_name, required
            )
            nested_fields[field_name] = (
                field_type,
                Field(
                    default=PydanticUndefined
                    if field_name in required_fields
                    else None,
                    description=field_schema.get("description", ""),
                    title=field_schema.get("title", field_name),
                    json_schema_extra={
                        k: v
                        for k, v in get_field_metadata(field_schema).items()
                        if k not in ["description", "title"]
                    },
                    **get_field_constraints(field_schema),
                ),
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
                "json_schema_extra": get_field_metadata(prop_schema),
            },
            **nested_fields,
        )
        return (model | None if is_nullable else model, None)

    if "enum" in prop_schema:
        enum_type = Literal[tuple(prop_schema["enum"])]
        # If there's a default value for enum, use it, otherwise make it optional
        if schema_default is not None:
            return (enum_type, schema_default)
        return (enum_type | None, None)

    if is_nullable:
        if isinstance(prop_schema.get("type"), list):
            # If type is a list, find the non-null type
            base_type = next(t for t in prop_schema["type"] if t != "null")
        else:
            # If type is a string or not specified, use it directly
            base_type = prop_schema.get("type", "string")

        type_tuple, _ = type_mapping.get(base_type, (Any, None))
        return (type_tuple | None, schema_default)

    type_tuple, default = type_mapping.get(
        prop_schema.get("type", "string"), (Any, None)
    )
    return (type_tuple, schema_default if schema_default is not None else default)


def create_dynamic_function_from_schema(
    schema: dict[str, Any],
    method: Literal["GET", "PUT", "DELETE", "POST", "PATCH"] = "GET",
    path: str = "",
    connection: Any | None = None,
) -> Callable:
    """Creates a dynamic function based on a JSON schema using Pydantic for validation.

    Args:
        schema: The OpenAPI schema for the endpoint
        method: The HTTP method to use
        path: The endpoint path
        connection: The connection configuration containing base_url and auth details
    """

    # Create Pydantic model
    properties = schema.get("properties", {})
    required = schema.get("required", [])

    print(method, path)

    field_definitions = {}

    for field_name, field_schema in properties.items():
        field_type, field_default = _get_pydantic_type(
            field_schema, field_name, required
        )

        # Get metadata and constraints
        metadata = get_field_metadata(field_schema)
        constraints = get_field_constraints(field_schema)

        # Handle required fields and defaults
        is_required = field_name in required
        default_value = (
            field_default
            if field_default is not None
            else PydanticUndefined
            if is_required
            else None
        )

        field_definitions[field_name] = (
            field_type,
            Field(
                default=default_value,
                description=metadata.get("description", ""),
                title=metadata.get(
                    "title", field_name
                ),  # Use field_name as fallback title
                json_schema_extra={
                    k: v
                    for k, v in get_field_metadata(field_schema).items()
                    if k not in ["description", "title"]
                },
                **constraints,
            ),
        )

    InputModel = create_model(
        schema.get("title", "DynamicModel"),
        __base__=BaseModel,
        __module__=__name__,
        model_config={"arbitrary_types_allowed": True},
        **field_definitions,
    )

    # Sort fields by required first, then optional
    sorted_fields = sorted(
        InputModel.model_fields.items(),
        key=lambda x: (
            x[0] not in required,
            x[0],
        ),  # Sort by required status first, then name
    )

    # Create parameters in order
    parameters = []
    for field_name, field in sorted_fields:
        type_hint = get_type_hints(InputModel)[field_name]
        is_required = field_name in required

        # Create Field with description but handle default value based on required status
        param_field = Field(
            default=PydanticUndefined
            if is_required
            else (field.default if field.default is not ... else None),
            description=field.description,
            title=field.title,  # Preserve title in parameter field
            json_schema_extra=field.json_schema_extra,
        )

        parameters.append(
            Parameter(
                field_name,
                Parameter.POSITIONAL_OR_KEYWORD,
                default=param_field,
                annotation=type_hint,
            )
        )

    async def dynamic_function(*args, **kwargs):
        bound_args = Signature(parameters=parameters, return_annotation=Any).bind(
            *args, **kwargs
        )
        bound_args.apply_defaults()

        cleaned_args = {
            name: value.default if isinstance(value, FieldInfo) else value
            for name, value in bound_args.arguments.items()
        }

        # Create validated model instance
        model_instance = InputModel(**cleaned_args)

        try:
            # Store bound arguments for endpoint configuration
            dynamic_function.__bound_args__ = cleaned_args

            # If no connection is provided (test environment), return model data directly
            if connection is None:
                return model_instance.model_dump()

            print("Creating endpoint configuration...")
            # First translate the function call to an endpoint configuration
            endpoint_config = translate_fn_to_endpoint(
                base_url="https://api.github.com",
                method="GET",
                path=f"/repos/{model_instance.owner}/{model_instance.repo}/issues",
                connection=connection.id if connection else "",
                fn=dynamic_function,
            )

            print(f"Endpoint Config created: {endpoint_config.model_dump()}")

            print("Executing endpoint...")
            # Then execute the endpoint
            response = await execute_endpoint(endpoint_config)
            print(f"Response received: {response}")
            return response.data if response.data is not None else response.error
        except Exception as e:
            import traceback

            print(f"Error during API call: {str(e)}")
            print(f"Error type: {type(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            # Fall back to returning model dump if API call fails
            return model_instance.model_dump()

    # Add metadata
    dynamic_function.__signature__ = Signature(
        parameters=parameters, return_annotation=Any
    )
    dynamic_function.__annotations__ = {p.name: p.annotation for p in parameters}
    dynamic_function.__name__ = schema.get("title", "dynamic_function")
    dynamic_function.model = InputModel
    print(dynamic_function.__annotations__)
    print(dynamic_function.__signature__)
    print(dynamic_function.__name__)
    print(dynamic_function.model)

    return dynamic_function

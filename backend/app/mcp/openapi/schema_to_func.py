from collections.abc import Callable
from inspect import Parameter, Signature
from typing import Any, Union, get_type_hints

from pydantic import BaseModel, ConfigDict, Field, create_model
from pydantic.fields import PydanticUndefined

from .executor import execute_dynamic_function


def _create_parameter(
    name: str, prop: dict[str, Any], field_type: type, is_required: bool
) -> Parameter:
    """Create a parameter with FieldInfo as default value."""
    # Create FieldInfo with proper required status
    param_field = Field(
        default=PydanticUndefined if is_required else prop.get("default"),
        description=prop.get("description", ""),
        title=prop.get("title"),
    )

    return Parameter(
        name, Parameter.KEYWORD_ONLY, default=param_field, annotation=field_type
    )


def schema_to_function(
    schema: dict[str, Any],
    metadata: dict[str, Any] = None,
    config: dict[str, Any] = None,
) -> Callable:
    """
    Creates a dynamic function based on a JSON schema using Pydantic for validation.

    Args:
        schema: A JSON schema describing the function and its parameters
        metadata: Additional metadata for the function (default: {})
        config: Additional configuration for the model (default: {})

    Returns:
        A callable function with proper signature and validation
    """
    metadata = metadata or {}
    config = config or {}

    # Extract properties and required fields based on schema structure
    if "parameters" in schema and isinstance(schema["parameters"], dict):
        properties = schema["parameters"].get("properties", {})
        required = schema["parameters"].get("required", [])
    else:
        properties = schema.get("properties", {})
        required = schema.get("required", [])

    # Create model fields
    fields = {}
    for name, prop in properties.items():
        is_required = name in required
        field_type, default_value = _get_type(prop, name, required)
        fields[name] = (field_type, _create_field(prop, is_required, default_value))

    # Create Pydantic model
    model_name = schema.get("name", "DynamicModel")
    InputModel = create_model(
        model_name,
        __base__=BaseModel,
        __module__=__name__,
        model_config=ConfigDict(
            arbitrary_types_allowed=True,
            extra="allow" if schema.get("additionalProperties", True) else "forbid",
            json_schema_extra={**metadata, **config},
        ),
        **fields,
    )

    # Create function parameters
    parameters = [
        _create_parameter(
            name, properties[name], get_type_hints(InputModel)[name], name in required
        )
        for name in fields
    ]

    # Create dynamic function
    async def dynamic_function(**kwargs):
        """Dynamic function generated from schema."""
        validated = InputModel(**kwargs)
        print("Input is ", validated)
        return await execute_dynamic_function(validated, dynamic_function)

    # Add metadata to function
    dynamic_function.__signature__ = Signature(parameters=parameters)
    dynamic_function.__annotations__ = {p.name: p.annotation for p in parameters}
    dynamic_function.__name__ = schema.get("name", "dynamic_function")
    dynamic_function.__doc__ = schema.get("description", "")
    dynamic_function.model = InputModel
    print("Signature: ", dynamic_function.__signature__)
    print("Annotations: ", dynamic_function.__annotations__)
    print("Name: ", dynamic_function.__name__)
    print("Doc: ", dynamic_function.__doc__)
    # print("Model: ", dynamic_function.model.model_json_schema())

    return dynamic_function


def _create_field(schema: dict[str, Any], required: bool, default: Any = None) -> Field:
    """Create a Pydantic field with proper metadata and validation."""
    from pydantic.fields import PydanticUndefined

    constraints = _extract_constraints(schema)

    # Use PydanticUndefined (or ...) for required fields with no default
    default_value = (
        default if default is not None else PydanticUndefined if required else None
    )

    return Field(
        default=default_value, description=schema.get("description", ""), **constraints
    )


def _extract_constraints(schema: dict[str, Any]) -> dict[str, Any]:
    """Extract validation constraints from schema."""
    constraints = {}

    # String constraints
    if schema.get("minLength") is not None:
        constraints["min_length"] = schema["minLength"]
    if schema.get("maxLength") is not None:
        constraints["max_length"] = schema["maxLength"]
    if schema.get("pattern") is not None:
        constraints["pattern"] = schema["pattern"]

    # Number constraints
    if schema.get("minimum") is not None:
        constraints["ge"] = schema["minimum"]
    if schema.get("maximum") is not None:
        constraints["le"] = schema["maximum"]
    if schema.get("exclusiveMinimum") is not None:
        constraints["gt"] = schema["exclusiveMinimum"]
    if schema.get("exclusiveMaximum") is not None:
        constraints["lt"] = schema["exclusiveMaximum"]
    if schema.get("multipleOf") is not None:
        constraints["multiple_of"] = schema["multipleOf"]

    # Array constraints
    if schema.get("minItems") is not None:
        constraints["min_items"] = schema["minItems"]
    if schema.get("maxItems") is not None:
        constraints["max_items"] = schema["maxItems"]
    if schema.get("uniqueItems") is not None:
        constraints["unique_items"] = schema["uniqueItems"]

    # Handle enums
    if "enum" in schema:
        enum_values = schema["enum"]
        if all(isinstance(v, str) for v in enum_values):
            constraints["pattern"] = f"^({'|'.join(map(str, enum_values))})$"

    # Handle date-time format
    if schema.get("format") == "date-time":
        constraints[
            "pattern"
        ] = r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$"

    return constraints


def _get_type(
    schema: dict[str, Any], field_name: str = "", required: list[str] = None
) -> tuple[type, Any]:
    """Map JSON schema types to Python/Pydantic types and handle defaults."""
    required = required or []
    is_required = field_name in required
    default = schema.get("default")

    # Basic type mapping
    type_map = {
        "string": str,
        "integer": int,
        "number": float,
        "boolean": bool,
        "array": list,
        "object": dict,
    }

    # Special handling for OpenAI's oneOf/anyOf patterns
    if "oneOf" in schema or "anyOf" in schema:
        # Get the list of possible types
        variants = schema.get("oneOf", schema.get("anyOf", []))

        # For the specific case of Union[str, List[str]] pattern
        if (
            len(variants) == 2
            and any(v.get("type") == "string" for v in variants)
            and any(v.get("type") == "array" and "items" in v for v in variants)
        ):
            # Find the array variant
            array_variant = next(v for v in variants if v.get("type") == "array")

            # If array items are strings, use the exact Union[str, List[str]] pattern
            if array_variant.get("items", {}).get("type") == "string":
                return (str | list[str], default)

        # For other union types, process normally
        union_types = []
        for variant in variants:
            type_obj, _ = _get_type(
                variant, "", []
            )  # Don't pass required here to avoid recursion issues
            union_types.append(type_obj)

        # Create the Union type
        result_type = Union[tuple(union_types)]  # noqa: UP007

        # Only add nullable if not required
        if not is_required and default is None:
            return (result_type | None, default)
        return (result_type, default)

    # Handle arrays with item type
    if schema.get("type") == "array" and "items" in schema:
        # Get the item type, but make sure we don't make it nullable
        items_schema = schema["items"]
        if "oneOf" in items_schema or "anyOf" in items_schema:
            # Handle union types in array items
            item_type, _ = _get_type(items_schema)
        else:
            # For simple types, use the direct mapping
            item_type = type_map.get(items_schema.get("type", "string"), Any)

        # Create the list type
        array_type = list[item_type]

        # Only add nullable if not required
        if not is_required and default is None:
            return (array_type | None, default)
        return (array_type, default)

    # Handle nested objects
    if schema.get("type") == "object" and "properties" in schema:
        nested_fields = {}
        nested_required = schema.get("required", [])

        for name, prop in schema["properties"].items():
            field_type, field_default = _get_type(prop, name, nested_required)
            nested_fields[name] = (
                field_type,
                _create_field(prop, name in nested_required, field_default),
            )

        model_name = schema.get("title", "NestedModel")
        model = create_model(
            model_name,
            __base__=BaseModel,
            model_config={
                "arbitrary_types_allowed": True,
                "extra": "allow"
                if schema.get("additionalProperties", True)
                else "forbid",
            },
            **nested_fields,
        )

        # Only add nullable if not required
        if not is_required and default is None:
            return (model | None, None)
        return (model, None)

    # Get base type
    schema_type = schema.get("type", "string")
    if isinstance(schema_type, list):
        # Handle type: ["string", "null"] pattern
        if "null" in schema_type:
            non_null_type = next((t for t in schema_type if t != "null"), "string")
            base_type = type_map.get(non_null_type, Any)
            return (base_type | None, default)
        schema_type = schema_type[0]  # Use the first type if multiple

    base_type = type_map.get(schema_type, Any)

    # Return nullable type only if not required and no default
    if not is_required and default is None:
        return (base_type | None, default)
    return (base_type, default)

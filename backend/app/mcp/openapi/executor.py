import json
from collections.abc import Callable
from typing import Any, Literal
from urllib.parse import urljoin

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, ValidationError


class APIResponse(BaseModel):
    status_code: int
    data: Any | None = None
    error: str | None = None


class EndpointConfig(BaseModel):
    url: str
    method: str
    headers: dict[str, str] | None = None
    params: dict[str, Any] | None = None
    body: dict[str, Any] | None = None
    timeout: float | None = 30.0


async def execute_endpoint(
    config: EndpointConfig,
) -> APIResponse:
    """
    Execute an API endpoint with the provided configuration.

    Args:
        config: EndpointConfig object containing all necessary parameters for the API call

    Returns:
        APIResponse object containing the response status and data/error

    Raises:
        HTTPException: When the API call fails or returns an error status
    """
    print(f"Executing request to: {config.url}")
    print(f"Headers: {config.headers}")
    print(f"Params: {config.params}")

    try:
        async with httpx.AsyncClient(timeout=config.timeout) as client:
            print("Making request...")
            response = await client.request(
                method=config.method,
                url=config.url,
                headers=config.headers,
                params=config.params,
                json=config.body,
            )
            print(f"Response status: {response.status_code}")

            try:
                if response.text:
                    print("Parsing response...")
                    response_data = response.json()
                    print(f"Response data: {response_data}")
                else:
                    response_data = None
                    print("Empty response")
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                response_data = response.text

            if 200 <= response.status_code < 300:
                return APIResponse(status_code=response.status_code, data=response_data)
            else:
                error_str = (
                    json.dumps(response_data)
                    if isinstance(response_data, dict)
                    else str(response_data)
                )
                print(f"Error response: {error_str}")
                return APIResponse(status_code=response.status_code, error=error_str)

    except httpx.TimeoutException as e:
        print(f"Timeout error: {e}")
        raise HTTPException(status_code=504, detail=f"Request timed out: {str(e)}")
    except httpx.RequestError as e:
        print(f"Request error: {e}")
        raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")
    except ValidationError as e:
        print(f"Validation error: {e}")
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        import traceback

        print(f"Unexpected error: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


def translate_fn_to_endpoint(
    base_url: str,
    method: Literal["GET", "PUT", "DELETE", "POST", "PATCH"],
    path: str,
    connection: str,
    fn: Callable,
) -> EndpointConfig:
    """
    Translate a function to an EndpointConfig object based on the function's model metadata.

    Args:
        base_url: Base URL for the API
        method: HTTP method to use
        path: API endpoint path
        connection: Connection identifier
        fn: Generated function from schema_to_func

    Returns:
        EndpointConfig configured based on the function's model metadata
    """
    if not hasattr(fn, "model"):
        raise ValueError("Function must have a model attribute")
    print(connection)

    model = fn.model
    fields = model.model_fields

    # Get runtime arguments if they exist
    runtime_args = getattr(fn, "__bound_args__", {})

    # Initialize parameter containers
    headers: dict[str, str] = {}
    params: dict[str, Any] = {}
    body: dict[str, Any] = {}

    # Get values from the function attributes
    for field_name, field in fields.items():
        # Get the category from json_schema_extra, defaulting to "body"
        category = (
            field.json_schema_extra.get("x-category", "body")
            if field.json_schema_extra
            else "body"
        )

        # First try to get value from runtime arguments
        value = runtime_args.get(field_name)

        # If we have a value, use it
        if value is not None:
            if category == "headers" and isinstance(value, str):
                headers[field_name] = value
            elif category == "parameters":
                params[field_name] = value
            elif category == "body":
                body[field_name] = value
        # If we don't have a value but have a default, use the default
        elif field.default is not None:
            if category == "parameters":
                params[field_name] = field.default
            elif category == "body":
                body[field_name] = field.default

    # Ensure the URL is properly constructed
    full_url = urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))

    return EndpointConfig(
        url=full_url,
        method=method,
        headers=headers if headers else None,
        params=params if params else None,
        body=body if body else None,
        timeout=30.0,
    )


async def execute_dynamic_function(
    model_instance: BaseModel,
    connection: Any | None,
    dynamic_function: Callable,
) -> dict[str, Any]:
    """Execute the dynamic function with proper error handling"""
    # if connection is None:
    #     return model_instance.model_dump()

    try:
        endpoint_config = translate_fn_to_endpoint(
            base_url="https://api.github.com",
            method="GET",
            path=f"/repos/{model_instance.owner}/{model_instance.repo}/issues",
            connection=connection.id if connection else "",
            fn=dynamic_function,
        )

        response = await execute_endpoint(endpoint_config)
        return response.data if response.data is not None else response.error

    except Exception as e:
        import traceback

        print(f"Error during API call: {str(e)}")
        print(f"Error type: {type(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return model_instance.model_dump()

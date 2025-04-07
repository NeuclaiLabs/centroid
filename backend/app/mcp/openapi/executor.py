import json
from collections.abc import Callable
from typing import Any
from urllib.parse import urljoin

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, ValidationError
from sqlmodel import Session

from app.core.db import engine
from app.models import Connection
from app.models.connection import AuthType


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
    metadata: dict[str, Any],
    connection: Connection | None,
    fn: Callable,
    model_instance: BaseModel,
) -> EndpointConfig:
    """
    Translate a function to an EndpointConfig object based on the function's model metadata.

    Args:
        metadata: Metadata from the function's model
        connection: Connection object
        fn: Generated function from schema_to_func
        model_instance: Validated model instance containing the runtime values

    Returns:
        EndpointConfig configured based on the function's model metadata
    """
    if not hasattr(fn, "model"):
        raise ValueError("Function must have a model attribute")

    model = fn.model
    fields = model.model_fields

    # Get runtime values from the validated model instance
    runtime_values = model_instance.model_dump()

    # Initialize parameter containers
    headers: dict[str, str] = {}
    params: dict[str, Any] = {}
    body: dict[str, Any] = {}
    cookies: dict[str, str] = {}
    path_params: dict[str, str] = {}

    # Extract base path and method from metadata
    base_url = connection.base_url if connection else ""
    if not base_url and metadata.get("app_id") == "github":
        base_url = "https://api.github.com"
    path = metadata.get("path", "")
    method = metadata.get("method", "GET")

    # Get values from the function attributes
    for field_name, _ in fields.items():
        # Get parameter metadata
        param_meta = metadata.get(field_name, {})
        is_parameter = (
            isinstance(param_meta, dict)
            and "type" in param_meta
            and param_meta["type"] == "parameter"
        )
        param_in = param_meta.get("in") if isinstance(param_meta, dict) else None
        param_name = (
            param_meta.get("name", field_name)
            if isinstance(param_meta, dict)
            else field_name
        )

        # Get value from runtime values
        value = runtime_values.get(field_name)

        # Skip if no value
        # if value is None:
        #     continue

        print(f"Processing {param_name} with value {value}")
        # Handle parameters based on their location
        if is_parameter and param_in:
            if param_in == "query":
                params[param_name] = value
            elif param_in == "header" and isinstance(value, str):
                headers[param_name] = value
            elif param_in == "path":
                path_params[param_name] = str(value)
            elif param_in == "cookie":
                cookies[param_name] = str(value)
        else:
            print(f"Treating {param_name} as body")
            # If not explicitly a parameter or no location specified, treat as body
            body[param_name] = value

    # Apply path parameters
    if path_params:
        for name, value in path_params.items():
            path = path.replace(f"{{{name}}}", value)

    # Ensure the URL is properly constructed
    full_url = urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))

    # Add cookies to headers if any
    if cookies:
        cookie_str = "; ".join(f"{k}={v}" for k, v in cookies.items())
        headers["Cookie"] = cookie_str

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
    dynamic_function: Callable,
) -> dict[str, Any]:
    """Execute the dynamic function with proper error handling"""
    metadata = model_instance.model_config.get("json_schema_extra", {})

    try:
        # Get connection details if connection_id is provided
        connection_id = metadata.get("connection_id")
        print(f"Connection ID: {connection_id}")
        connection = None
        if connection_id:
            with Session(engine) as session:
                connection = session.get(Connection, connection_id)
        print(f"Connection: {connection}")

        endpoint_config = translate_fn_to_endpoint(
            metadata=metadata,
            connection=connection,
            fn=dynamic_function,
            model_instance=model_instance,
        )
        # print(f"Endpoint config: {endpoint_config}")
        # If we have a connection, add its auth configuration to headers
        if connection_id and connection and connection.auth:
            auth_config = connection.auth
            print(f"Auth config: {auth_config}")
            headers = endpoint_config.headers or {}

            if auth_config.type == AuthType.TOKEN:
                print(f"Token config: {auth_config.config}")
                headers["Authorization"] = f"Bearer {auth_config.config['token']}"
            elif auth_config.type == AuthType.API_KEY:
                config = auth_config.config
                if config["location"] == "header":
                    headers[config["key"]] = config["value"]
                elif config["location"] == "query":
                    params = endpoint_config.params or {}
                    params[config["key"]] = config["value"]
                    endpoint_config.params = params
            elif auth_config.type == AuthType.BASIC:
                import base64

                config = auth_config.config
                auth_string = f"{config['username']}:{config['password']}"
                encoded = base64.b64encode(auth_string.encode()).decode()
                headers["Authorization"] = f"Basic {encoded}"

            endpoint_config.headers = headers

        response = await execute_endpoint(endpoint_config)
        return response

    except Exception as e:
        import traceback

        print(f"Error during API call: {str(e)}")
        print(f"Error type: {type(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return model_instance.model_dump()

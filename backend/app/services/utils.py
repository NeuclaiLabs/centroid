import json

from pydantic import BaseModel


class APIEndpointExample(BaseModel):
    name: str
    status: int
    body: str
    headers: list[dict]


class APIEndpoint(BaseModel):
    name: str
    folder_path: str
    method: str
    url: str
    description: str = ""
    headers: list[dict] = []
    params: list[dict] = []
    body: dict = {}
    auth: dict = {}
    examples: list[APIEndpointExample] = []


class ChromaDBMetadata(BaseModel):
    file_id: str
    method: str
    url: str
    name: str
    folder_path: str
    has_examples: bool
    has_auth: bool
    has_body: bool


def parse_api_collection(content: dict) -> list[dict]:
    """Parse API collection and extract endpoints with metadata, handling multiple formats."""

    def parse_postman():
        endpoints = []

        def process_item(item, folder_path=""):
            current_path = (
                f"{folder_path}/{item.get('name', '')}"
                if folder_path
                else item.get("name", "")
            )

            if "request" in item:
                request = item.get("request", {})
                url_data = request.get("url", {})
                url = (
                    url_data.get("raw", "")
                    if isinstance(url_data, dict)
                    else str(url_data)
                )

                # Extract URL parameters
                params = []
                if isinstance(url_data, dict):
                    params = [
                        {
                            "key": p.get("key", ""),
                            "value": p.get("value", ""),
                            "description": p.get("description", ""),
                            "disabled": p.get("disabled", False),
                        }
                        for p in url_data.get("query", [])
                    ]

                endpoint = {
                    "name": item.get("name", ""),
                    "folder_path": current_path,
                    "method": request.get("method", ""),
                    "url": url,
                    "description": request.get("description", ""),
                    "headers": request.get("header", []),
                    "params": params,  # Add URL parameters
                    "body": request.get("body", {}),
                    "auth": request.get("auth", {}),
                    "examples": [],
                }

                if "response" in item:
                    responses = item["response"]
                    if isinstance(responses, list):
                        endpoint["examples"].extend(
                            [
                                {
                                    "name": resp.get("name", ""),
                                    "status": resp.get("code", 0),
                                    "body": resp.get("body", ""),
                                    "headers": resp.get("header", []),
                                }
                                for resp in responses
                            ]
                        )

                endpoints.append(endpoint)

            if "item" in item:
                for sub_item in item["item"]:
                    process_item(sub_item, current_path)

        for item in content.get("item", []):
            process_item(item)
        return endpoints

    def parse_openapi():
        endpoints = []
        paths = content.get("paths", {})

        for path, methods in paths.items():
            for method, details in methods.items():
                if method.lower() == "parameters":  # Skip common parameters
                    continue

                endpoint = {
                    "name": details.get("summary", path),
                    "folder_path": details.get("tags", [""])[
                        0
                    ],  # Use first tag as folder
                    "method": method.upper(),
                    "url": path,
                    "description": details.get("description", ""),
                    "headers": [],  # Extract from parameters
                    "params": [],  # Add params list for query parameters
                    "body": {},
                    "auth": {},
                    "examples": [],
                }

                # Handle parameters (headers, path params, query params)
                for param in details.get("parameters", []):
                    if param.get("in") == "header":
                        endpoint["headers"].append(
                            {
                                "key": param.get("name"),
                                "value": "",
                                "description": param.get("description", ""),
                            }
                        )
                    elif param.get("in") == "query":
                        endpoint["params"].append(
                            {
                                "key": param.get("name"),
                                "value": "",
                                "description": param.get("description", ""),
                                "disabled": False,
                            }
                        )

                # Handle request body
                if "requestBody" in details:
                    content_type = next(
                        iter(details["requestBody"].get("content", {})), ""
                    )
                    schema = (
                        details["requestBody"]
                        .get("content", {})
                        .get(content_type, {})
                        .get("schema", {})
                    )
                    endpoint["body"] = {
                        "mode": "raw",
                        "raw": json.dumps(schema, indent=2),
                    }

                # Handle response examples
                responses = details.get("responses", {})
                for status, response in responses.items():
                    content_type = next(iter(response.get("content", {})), "")
                    example = (
                        response.get("content", {}).get(content_type, {}).get("example")
                    )
                    if example:
                        endpoint["examples"].append(
                            {
                                "name": f"Response {status}",
                                "status": int(status),
                                "body": json.dumps(example, indent=2),
                                "headers": [],
                            }
                        )

                endpoints.append(endpoint)
        return endpoints

    # Detect format and parse accordingly
    if (
        content.get("info", {})
        .get("schema", "")
        .startswith("https://schema.getpostman.com")
    ):
        return parse_postman()
    elif content.get("openapi") or content.get("swagger"):
        return parse_openapi()

    return []  # Return empty list for unsupported formats

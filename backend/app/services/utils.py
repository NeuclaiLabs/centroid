import json
import os
import subprocess
import tempfile
from typing import Any

from pydantic import BaseModel

from app.core.logger import get_logger

logger = get_logger(__name__)


class APIEndpointExample(BaseModel):
    name: str | None = None
    status: int | None = None
    body: str | None = None
    headers: list[dict] | None = None


class Url(BaseModel):
    raw: str | None = None
    path: list[str] | None = None
    host: list[str] | None = None
    query: list[dict[str, Any]] | None = None
    variable: list[dict[str, Any]] | None = None


class Request(BaseModel):
    name: str | None = None
    description: dict[str, str] | None = None
    url: Url
    method: str
    header: list[dict[str, Any]] | None = None
    body: dict[str, Any] | None = None
    auth: dict[str, Any] | None = None


class Response(BaseModel):
    id: str | None = None
    name: str | None = None
    originalRequest: Request | None = None
    status: str | None = None
    code: int | None = None
    header: list[dict[str, Any]] | None = None
    body: str | None = None
    cookie: list[Any] | None = None
    _postman_previewlanguage: str | None = None


class Endpoint(BaseModel):
    id: str | None = None
    name: str | None = None
    request: Request | None = None
    response: list[Response] | None = None
    event: list[Any] | None = None
    protocolProfileBehavior: dict[str, Any] | None = None


class Folder(BaseModel):
    name: str
    description: str | None
    item: list[Any]  # Can be either Endpoint or Folder


class Collection(BaseModel):
    info: dict[str, Any] | None = None
    item: list[Folder] | None = None
    event: list[Any] | None = None
    variable: list[dict[str, Any]] | None = None


class APIUrl(BaseModel):
    raw: str | None = None
    path: list[str] | None = None
    host: list[str] | None = None
    query: list[dict[str, Any]] | None = None
    variable: list[dict[str, Any]] | None = None


class APIRequest(BaseModel):
    name: str | None = None
    description: dict[str, str] | None = None
    url: APIUrl
    method: str
    header: list[dict[str, Any]] | None = None
    body: dict[str, Any] | None = None
    auth: dict[str, Any] | None = None


class APIResponse(BaseModel):
    id: str
    name: str
    originalRequest: APIRequest | None
    status: str | None
    code: int | None
    header: list[dict[str, Any]] | None = None
    body: str | None
    cookie: list[Any] | None


class APIEndpoint(BaseModel):
    id: str
    name: str
    request: APIRequest
    response: list[APIResponse]
    event: list[Any] | None
    folder: str = ""


class APIFolder(BaseModel):
    name: str
    description: str | None
    item: list[Any]  # Can be either APIEndpoint or APIFolder


class APICollection(BaseModel):
    info: dict[str, Any]
    item: list[APIFolder]
    event: list[Any] | None
    variable: list[dict[str, Any]] | None


def process_folder(
    folder: APIFolder,
    parent_path: str = "",
    endpoints: list[dict[str, Any]] | None = None,
) -> None:
    if endpoints is None:
        endpoints = []
    current_path = f"{parent_path}/{folder.name}" if parent_path else folder.name

    for item in folder.item:
        if "request" in item:  # It's an endpoint
            if isinstance(item, APIEndpoint):
                endpoint = item
            else:
                endpoint = APIEndpoint(**item)
            endpoint.folder = current_path
            endpoints.append(endpoint.model_dump())  # Convert to dict before appending
        else:  # It's a subfolder
            subfolder = APIFolder(**item)
            process_folder(subfolder, current_path, endpoints)


def parse_api_collection(
    content: dict[str, Any], file_id: str = ""
) -> list[dict[str, Any]]:
    """Parse an API collection and extract endpoints with their metadata."""

    # Handle OpenAPI format
    if content.get("openapi") or content.get("swagger"):
        logger.info(
            f"Converting OpenAPI/Swagger spec to Postman format for file_id: {file_id}"
        )

        # Convert OpenAPI to Postman format
        with tempfile.NamedTemporaryFile(
            suffix=".json", mode="w", delete=False
        ) as input_file:
            json.dump(content, input_file)
            input_path = input_file.name

        output_path = os.path.join(tempfile.gettempdir(), f"{file_id}_postman.json")
        logger.debug(
            f"Created temporary files - Input: {input_path}, Output: {output_path}"
        )

        try:
            cmd = [
                "openapi2postmanv2",
                "-s",
                input_path,
                "-o",
                output_path,
                "-p",
                "-O",
                "folderStrategy=Tags,requestParametersResolution=Example,optimizeConversion=false,stackLimit=50",
            ]
            logger.debug(f"Executing conversion command: {' '.join(cmd)}")
            subprocess.run(cmd, check=True)

            with open(output_path) as f:
                content = json.load(f)
            logger.info("Successfully converted OpenAPI spec to Postman format")

        except Exception as e:
            logger.error(
                f"Error converting OpenAPI to Postman: {str(e)}", exc_info=True
            )
            return []

        finally:
            # Cleanup temporary files
            try:
                os.unlink(input_path)
                os.unlink(output_path)
                logger.debug("Cleaned up temporary files")
            except Exception as e:
                logger.warning(f"Failed to cleanup temporary files: {str(e)}")

    # Continue with existing Postman collection parsing
    collection = APICollection(**content)
    endpoints = []

    for folder in collection.item:
        process_folder(folder, endpoints=endpoints)

    return endpoints

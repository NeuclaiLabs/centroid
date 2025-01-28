import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

import chromadb
import yaml
from chromadb.config import Settings
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.config import settings
from app.models import Message

router = APIRouter()


class UploadResponse(BaseModel):
    message: str
    files: list[str]


class FileContentRequest(BaseModel):
    file: str


class FileContentResponse(BaseModel):
    data: Any
    file: str


class SearchResponse(BaseModel):
    success: bool
    query: str
    results: list[dict] = []
    metadata: dict = {
        "totalEndpoints": 0,
        "searchMethod": "fts",
        "timestamp": "",
        "searchParameters": {"includeExamples": False, "limit": 50, "where": None},
    }
    error: str | None = None


# Create upload directory if it doesn't exist
def ensure_upload_dir(project_id: str) -> Path:
    upload_path = Path(settings.UPLOAD_DIR) / project_id
    upload_path.mkdir(parents=True, exist_ok=True)
    return upload_path


# Initialize ChromaDB client
chroma_client = chromadb.PersistentClient(
    path=str(Path(settings.UPLOAD_DIR) / ".chromadb"),
    settings=Settings(anonymized_telemetry=False),
)


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

                endpoint = {
                    "name": item.get("name", ""),
                    "folder_path": current_path,
                    "method": request.get("method", ""),
                    "url": url,
                    "description": request.get("description", ""),
                    "headers": request.get("header", []),
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


def store_embeddings(project_id: str, file_id: str, content: dict):
    """Store endpoints in ChromaDB with their embeddings."""
    # First check if this is a supported API collection
    if not isinstance(content, dict) or not (
        content.get("info", {})
        .get("schema", "")
        .startswith("https://schema.getpostman.com")
        or content.get("openapi")
        or content.get("swagger")
    ):
        return  # Not a supported API collection format

    # Parse the collection
    endpoints = parse_api_collection(content)
    if not endpoints:
        return

    collection = chroma_client.get_or_create_collection(
        name=project_id,
        metadata={"hnsw:space": "cosine"},
    )

    documents = []
    metadatas = []
    ids = []

    for i, endpoint in enumerate(endpoints):
        # Create a clean copy of endpoint data for embedding
        endpoint_for_embedding = {
            **endpoint,
            # "examples": len(
            #     endpoint.get("examples", [])
            # ),  # Just store count of examples
            # "auth": endpoint.get("auth", {}).get(
            #     "type", "none"
            # ),  # Simplify auth to just type
        }

        # Remove any empty or None values
        doc_text = json.dumps(
            {k: v for k, v in endpoint_for_embedding.items() if v}, indent=2
        )

        doc_id = f"{file_id}_{i}"

        documents.append(doc_text)
        metadatas.append(
            {
                "file_id": file_id,
                "method": endpoint["method"],
                "url": endpoint["url"],
                "name": endpoint["name"],
                "folder_path": endpoint["folder_path"],
                "has_examples": len(endpoint.get("examples", [])) > 0,
                "has_auth": bool(endpoint.get("auth")),
                "has_body": bool(endpoint.get("body")),
            }
        )
        ids.append(doc_id)

    # Add documents to collection
    if documents:
        collection.add(documents=documents, metadatas=metadatas, ids=ids)


# Add these new endpoints to your router


@router.post("/", response_model=UploadResponse)
async def upload_files(
    *,
    project_id: str,
    files: list[UploadFile] = File(...),
) -> Any:
    """
    Upload files to a project and generate embeddings for API collections.
    Returns a list of safe filenames that were successfully uploaded.
    """
    upload_dir = ensure_upload_dir(project_id)
    uploaded_files = []

    for upload_file in files:
        filename = Path(upload_file.filename).name
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{filename}"
        file_path = upload_dir / safe_filename

        try:
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(upload_file.file, buffer)

            relative_path = str(Path(project_id) / safe_filename)
            uploaded_files.append(relative_path)

            # Generate embeddings for potential API collections
            if filename.lower().endswith((".json", ".yaml", ".yml")):
                try:
                    with file_path.open("r", encoding="utf-8") as f:
                        content = (
                            json.load(f)
                            if filename.lower().endswith(".json")
                            else yaml.safe_load(f)
                        )
                        store_embeddings(project_id, safe_filename, content)
                except Exception as e:
                    print(f"Error processing file for embeddings: {str(e)}")

        finally:
            upload_file.file.close()

    return UploadResponse(
        message=f"Successfully uploaded {len(uploaded_files)} files",
        files=uploaded_files,
    )


@router.delete("/", response_model=Message)
async def delete_file(
    *,
    file: str,
) -> Any:
    """Delete a file and its embeddings from a project."""

    if not file:
        raise HTTPException(status_code=404, detail="File not found in project")

    # Remove the file from storage
    full_path = Path(settings.UPLOAD_DIR) / file
    print("Full path: ", full_path)
    try:
        if full_path.exists():
            full_path.unlink()

            # Delete embeddings if they exist
            project_id = Path(file).parts[0]  # First part of the path is project_id
            try:
                collection = chroma_client.get_collection(name=project_id)
                # Delete all documents with matching file_id
                collection.delete(where={"file_id": Path(file).name})
            except Exception as e:
                print(f"Error deleting embeddings: {str(e)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")

    return Message(message=f"File deleted successfully: {file}")


@router.get("/", response_model=FileContentResponse)
async def get_file_content(file: str) -> Any:
    """Get the content of a file."""
    if not file:
        raise HTTPException(status_code=400, detail="File path is required")

    file_path = Path(settings.UPLOAD_DIR) / file

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    if not file_path.is_file():
        raise HTTPException(status_code=400, detail="Path is not a file")

    try:
        with file_path.open("r", encoding="utf-8") as f:
            content = f.read()

        # Try to parse as JSON if it's a JSON file
        if file_path.suffix.lower() == ".json":
            try:
                return FileContentResponse(data=json.loads(content), file=file)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid JSON file")

        # Try to parse as YAML if it's a YAML file
        elif file_path.suffix.lower() in [".yaml", ".yml"]:
            try:
                return FileContentResponse(data=yaml.safe_load(content), file=file)
            except yaml.YAMLError:
                raise HTTPException(status_code=400, detail="Invalid YAML file")

        # Return raw content for other files
        return FileContentResponse(data=content, file=file)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error reading file content: {str(e)}"
        )


@router.get("/search", response_model=SearchResponse)
async def search_api_collections(
    project_id: str,
    query: str,
    limit: int = 10,
    where: str | None = None,  # Add where parameter for metadata filtering
) -> Any:
    """
    Search for API endpoints using semantic similarity with optional metadata filtering.
    Returns matched endpoints ordered by relevance.
    """
    try:
        collection = chroma_client.get_collection(name=project_id)

        # Parse the where filter if provided
        where_filter = None
        if where:
            try:
                where_filter = json.loads(where)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid where filter format. Must be valid JSON.",
                )

        # Perform similarity search with optional metadata filtering
        results = collection.query(
            query_texts=[query],
            n_results=limit,
            where=where_filter,  # Add metadata filtering
            include=["documents", "metadatas", "distances"],
        )

        # Process results
        processed_results = []
        for doc, metadata, distance in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
            strict=False,
        ):
            # Parse the document JSON
            endpoint_data = json.loads(doc)

            # Add search metadata
            result = {
                "endpoint": endpoint_data,
                "metadata": metadata,
                "score": distance,  # Convert cosine distance to similarity score (0-1)
            }
            processed_results.append(result)

        # Update metadata to include the where filter
        response = SearchResponse(
            success=True,
            query=query,
            results=processed_results,
            metadata={
                "totalEndpoints": len(processed_results),
                "searchMethod": "semantic_similarity",
                "timestamp": datetime.now().isoformat(),
                "searchParameters": {
                    "limit": limit,
                    "where": where_filter,  # Include the where filter in response metadata
                },
            },
        )

        return response

    except Exception as e:
        return SearchResponse(
            success=False,
            query=query,
            error=f"Search failed: {str(e)}",
        )

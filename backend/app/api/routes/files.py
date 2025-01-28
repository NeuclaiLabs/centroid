import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.config import settings
from app.models import Message
from app.services.api_search_service import (
    delete_embeddings,
    search_endpoints,
    store_embeddings,
)

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
async def delete_file(*, file: str) -> Any:
    """Delete a file and its embeddings from a project."""
    if not file:
        raise HTTPException(status_code=404, detail="File not found in project")

    full_path = Path(settings.UPLOAD_DIR) / file
    try:
        if full_path.exists():
            full_path.unlink()

            # Delete embeddings if they exist
            project_id = Path(file).parts[0]
            delete_embeddings(project_id, Path(file).name)

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
    where: str | None = None,
) -> Any:
    """
    Search for API endpoints using semantic similarity with optional metadata filtering.
    """
    try:
        where_filter = json.loads(where) if where else None

        results = search_endpoints(project_id, query, limit, where_filter)

        # Process results
        processed_results = []
        for doc, metadata, distance in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
            strict=False,
        ):
            endpoint_data = json.loads(doc)
            result = {
                "endpoint": endpoint_data,
                "metadata": metadata,
                "score": distance,
            }
            processed_results.append(result)

        return SearchResponse(
            success=True,
            query=query,
            results=processed_results,
            metadata={
                "totalEndpoints": len(processed_results),
                "searchMethod": "semantic_similarity",
                "timestamp": datetime.now().isoformat(),
                "searchParameters": {
                    "limit": limit,
                    "where": where_filter,
                },
            },
        )

    except Exception as e:
        return SearchResponse(
            success=False,
            query=query,
            error=f"Search failed: {str(e)}",
        )

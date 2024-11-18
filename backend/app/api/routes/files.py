import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.config import settings
from app.models import (
    Message,
)

router = APIRouter()


class UploadResponse(BaseModel):
    message: str
    files: list[str]


# Create upload directory if it doesn't exist
def ensure_upload_dir(project_id: str) -> Path:
    upload_path = Path(settings.UPLOAD_DIR) / project_id
    upload_path.mkdir(parents=True, exist_ok=True)
    return upload_path


# Add these new endpoints to your router


@router.post("/", response_model=UploadResponse)
async def upload_files(
    *,
    project_id: str,
    files: list[UploadFile] = File(...),
) -> Any:
    """
    Upload files to a project.
    Returns a list of safe filenames that were successfully uploaded.
    """
    # Ensure upload directory exists
    upload_dir = ensure_upload_dir(project_id)

    # Keep track of uploaded files
    uploaded_files = []

    # Process each uploaded file
    for upload_file in files:
        # Create a safe filename
        filename = Path(upload_file.filename).name
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{filename}"

        # Create the file path
        file_path = upload_dir / safe_filename

        # Save the file
        try:
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(upload_file.file, buffer)

            # Store the relative path in the project's files list
            relative_path = str(Path(project_id) / safe_filename)
            uploaded_files.append(relative_path)

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
    """Delete a file from a project."""

    if not file:
        raise HTTPException(status_code=404, detail="File not found in project")

    # Remove the file from storage
    full_path = Path(settings.UPLOAD_DIR) / file
    print("Full path: ", full_path)
    try:
        if full_path.exists():
            full_path.unlink()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")

    return Message(message=f"File deleted successfully: {file}")

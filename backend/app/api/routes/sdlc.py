"""
SDLC API routes for managing software development lifecycle tasks.
Provides unified endpoints for developer, planner, reviewer, architect, tester, and documenter tools.
"""

import json
from datetime import datetime
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models import Document, DocumentKind, DocumentOut
from app.models.base import CamelModel
from app.services.sdlc_service import SDLCService, SDLCToolType, TaskStatus

router = APIRouter()


class SDLCTaskRequest(CamelModel):
    """Request model for creating SDLC tasks."""

    tool_type: SDLCToolType
    task: str
    context: dict[str, Any] | None = None
    working_directory: str | None = None


class SDLCTaskResponse(CamelModel):
    """Response model for SDLC task operations."""

    task_id: str
    status: str
    message: str


async def execute_sdlc_task_background(task_id: str, task_data: dict[str, Any], engine):
    """
    Background task to execute SDLC tasks and update document with results.

    Args:
        task_id: Document ID for tracking the task
        task_data: Task data containing tool_type, task, context, etc.
        engine: Database engine for creating sessions
    """
    from sqlmodel import Session

    try:
        # Execute the task
        updated_task_data = await SDLCService.execute_task(task_data)

        # Update document with results
        with Session(engine) as session:
            # Find the document
            statement = select(Document).where(Document.id == task_id)
            document = session.exec(statement).first()

            if document:
                # Update document content with task results
                document.content = json.dumps(updated_task_data)
                document.updated_at = datetime.now()
                session.add(document)
                session.commit()

    except Exception as e:
        # Handle errors by updating document with error state
        with Session(engine) as session:
            statement = select(Document).where(Document.id == task_id)
            document = session.exec(statement).first()

            if document:
                error_data = {
                    "status": TaskStatus.ERROR.value,
                    "error": str(e),
                    "completed_at": datetime.now().isoformat(),
                }
                document.content = json.dumps(error_data)
                document.updated_at = datetime.now()
                session.add(document)
                session.commit()


@router.post("/tasks", response_model=SDLCTaskResponse)
async def create_sdlc_task(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks,
    request: SDLCTaskRequest,
) -> Any:
    """
    Create a new SDLC task and start execution in the background.

    Args:
        session: Database session
        current_user: Current authenticated user
        background_tasks: FastAPI background tasks
        request: SDLC task request data

    Returns:
        Task response with task ID and status
    """
    try:
        # Create initial task data
        task_data = await SDLCService.create_task(
            tool_type=request.tool_type,
            task=request.task,
            context=request.context,
            working_directory=request.working_directory,
            user_id=current_user.id,
        )

        # Create document to track the task
        now = datetime.now()
        document = Document(
            id=f"sdlc_{request.tool_type.value}_{int(now.timestamp())}",
            title=f"{request.tool_type.value.title()}: {request.task[:50]}{'...' if len(request.task) > 50 else ''}",
            content=json.dumps(task_data),  # Store task data as JSON
            kind=DocumentKind.CODE,  # Using CODE kind for SDLC tasks
            user_id=current_user.id,
            created_at=now,
            updated_at=now,
        )

        session.add(document)
        session.commit()
        session.refresh(document)

        # Start background task execution
        background_tasks.add_task(
            execute_sdlc_task_background, document.id, task_data, session.get_bind()
        )

        return SDLCTaskResponse(
            task_id=document.id,
            status=TaskStatus.IN_PROGRESS.value,
            message=f"SDLC task created successfully. Task ID: {document.id}",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create SDLC task: {str(e)}"
        )


@router.get("/tasks/{task_id}", response_model=DocumentOut)
async def get_sdlc_task(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    task_id: str,
) -> Any:
    """
    Get SDLC task status and results by task ID.

    Args:
        session: Database session
        current_user: Current authenticated user
        task_id: Task ID to retrieve

    Returns:
        Document containing task data and results
    """
    # Find the document
    statement = select(Document).where(Document.id == task_id)
    document = session.exec(statement).first()

    if not document:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check permissions
    if not current_user.is_superuser and document.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return document


@router.get("/tasks/{task_id}/status")
async def get_sdlc_task_status(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    task_id: str,
) -> Any:
    """
    Get simplified task status for polling.

    Args:
        session: Database session
        current_user: Current authenticated user
        task_id: Task ID to check

    Returns:
        Task status information
    """
    # Find the document
    statement = select(Document).where(Document.id == task_id)
    document = session.exec(statement).first()

    if not document:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check permissions
    if not current_user.is_superuser and document.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Parse task data from document content
    try:
        task_data = json.loads(document.content) if document.content else {}
        status = task_data.get("status", TaskStatus.IN_PROGRESS.value)

        return {
            "task_id": task_id,
            "status": status,
            "tool_type": task_data.get("tool_type"),
            "created_at": task_data.get("created_at"),
            "completed_at": task_data.get("completed_at"),
            "has_result": status == TaskStatus.COMPLETED.value
            and "result" in task_data,
            "has_error": status == TaskStatus.ERROR.value and "error" in task_data,
        }

    except json.JSONDecodeError:
        return {
            "task_id": task_id,
            "status": TaskStatus.ERROR.value,
            "error": "Invalid task data format",
        }


@router.delete("/tasks/{task_id}")
async def delete_sdlc_task(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    task_id: str,
) -> Any:
    """
    Delete an SDLC task.

    Args:
        session: Database session
        current_user: Current authenticated user
        task_id: Task ID to delete

    Returns:
        Success message
    """
    # Find the document
    statement = select(Document).where(Document.id == task_id)
    document = session.exec(statement).first()

    if not document:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check permissions
    if not current_user.is_superuser and document.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Delete the document
    session.delete(document)
    session.commit()

    return {"message": "Task deleted successfully"}

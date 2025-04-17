from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    ToolInstance,
    ToolInstanceCreate,
    ToolInstanceOut,
    ToolInstancesOut,
    ToolInstanceUpdate,
    UtilsMessage,
)

router = APIRouter()


@router.get("/", response_model=ToolInstancesOut)
def read_tool_instances(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve tool instances.
    All search parameters are optional and will be automatically parsed from query parameters.
    """
    # Build base query
    query = select(ToolInstance).where(ToolInstance.owner_id == current_user.id)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count = session.exec(count_query).one()

    # Get paginated results
    query = query.offset(skip).limit(limit)
    tools = session.exec(query).all()

    return ToolInstancesOut(data=tools, count=count)


@router.get("/{id}", response_model=ToolInstanceOut)
def read_tool_instance(session: SessionDep, current_user: CurrentUser, id: str) -> Any:
    """
    Get tool instance by ID.
    """
    tool = session.get(ToolInstance, id)

    if not tool:
        raise HTTPException(status_code=404, detail="Tool instance not found")
    if not current_user.is_superuser and tool.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return tool


@router.post("/", response_model=ToolInstanceOut)
def create_tool_instance(
    *, session: SessionDep, current_user: CurrentUser, tool_in: ToolInstanceCreate
) -> Any:
    """
    Create new tool instance.
    """
    tool = ToolInstance.model_validate(tool_in)
    tool.owner_id = current_user.id
    session.add(tool)
    session.commit()
    session.refresh(tool)
    return tool


@router.put("/{id}", response_model=ToolInstanceOut)
def update_tool_instance(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: str,
    tool_in: ToolInstanceUpdate,
) -> Any:
    """
    Update a tool instance.
    """
    tool = session.get(ToolInstance, id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool instance not found")
    if not current_user.is_superuser and tool.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Only update the fields that were provided
    update_dict = tool_in.model_dump(exclude_unset=True)
    if update_dict:
        tool.sqlmodel_update(update_dict)
        session.add(tool)
        session.commit()
        session.refresh(tool)

    return tool


@router.delete("/{id}")
def delete_tool_instance(
    session: SessionDep, current_user: CurrentUser, id: str
) -> UtilsMessage:
    """
    Delete a tool instance.
    """
    tool = session.get(ToolInstance, id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool instance not found")
    if not current_user.is_superuser and tool.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(tool)
    session.commit()
    return UtilsMessage(message="Tool instance deleted successfully")

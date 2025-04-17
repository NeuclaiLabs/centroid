from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    MCPInstance,
    MCPInstanceCreate,
    MCPInstanceOut,
    MCPInstancesOut,
    MCPInstanceUpdate,
    UtilsMessage,
)

router = APIRouter()


@router.get("/", response_model=MCPInstancesOut)
def read_mcp_instances(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve MCP instances.
    All search parameters are optional and will be automatically parsed from query parameters.
    """
    # Build base query
    query = select(MCPInstance).where(MCPInstance.owner_id == current_user.id)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count = session.exec(count_query).one()

    # Get paginated results
    query = query.offset(skip).limit(limit)
    mcp_instances = session.exec(query).all()

    return MCPInstancesOut(data=mcp_instances, count=count)


@router.get("/{id}", response_model=MCPInstanceOut)
def read_mcp_instance(session: SessionDep, current_user: CurrentUser, id: str) -> Any:
    """
    Get MCP instance by ID.
    """
    mcp_instance = session.get(MCPInstance, id)

    if not mcp_instance:
        raise HTTPException(status_code=404, detail="MCP instance not found")
    if not current_user.is_superuser and mcp_instance.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return mcp_instance


@router.post("/", response_model=MCPInstanceOut)
def create_mcp_instance(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    mcp_instance_in: MCPInstanceCreate,
) -> Any:
    """
    Create new MCP instance.
    """
    mcp_instance = MCPInstance.model_validate(mcp_instance_in)
    mcp_instance.owner_id = current_user.id
    session.add(mcp_instance)
    session.commit()
    session.refresh(mcp_instance)
    return mcp_instance


@router.put("/{id}", response_model=MCPInstanceOut)
def update_mcp_instance(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: str,
    mcp_instance_in: MCPInstanceUpdate,
) -> Any:
    """
    Update an MCP instance.
    """
    mcp_instance = session.get(MCPInstance, id)
    if not mcp_instance:
        raise HTTPException(status_code=404, detail="MCP instance not found")
    if not current_user.is_superuser and mcp_instance.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Only update the fields that were provided
    update_dict = mcp_instance_in.model_dump(exclude_unset=True)
    if update_dict:
        mcp_instance.sqlmodel_update(update_dict)
        session.add(mcp_instance)
        session.commit()
        session.refresh(mcp_instance)

    return mcp_instance


@router.delete("/{id}")
def delete_mcp_instance(
    session: SessionDep, current_user: CurrentUser, id: str
) -> UtilsMessage:
    """
    Delete an MCP instance.
    """
    mcp_instance = session.get(MCPInstance, id)
    if not mcp_instance:
        raise HTTPException(status_code=404, detail="MCP instance not found")
    if not current_user.is_superuser and mcp_instance.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(mcp_instance)
    session.commit()
    return UtilsMessage(message="MCP instance deleted successfully")

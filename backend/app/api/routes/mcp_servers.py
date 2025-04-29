from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    MCPServer,
    MCPServerCreate,
    MCPServerOut,
    MCPServersOut,
    MCPServerUpdate,
    UtilsMessage,
)

router = APIRouter()


@router.get("/", response_model=MCPServersOut)
def read_mcp_servers(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve MCP servers.
    All search parameters are optional and will be automatically parsed from query parameters.
    """
    # Build base query
    query = select(MCPServer).where(MCPServer.owner_id == current_user.id)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count = session.exec(count_query).one()

    # Get paginated results
    query = query.offset(skip).limit(limit)
    mcp_servers = session.exec(query).all()

    return MCPServersOut(data=mcp_servers, count=count)


@router.get("/{id}", response_model=MCPServerOut)
def read_mcp_server(session: SessionDep, current_user: CurrentUser, id: str) -> Any:
    """
    Get MCP server by ID.
    """
    mcp_server = session.get(MCPServer, id)

    if not mcp_server:
        raise HTTPException(status_code=404, detail="MCP server not found")
    if not current_user.is_superuser and mcp_server.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return mcp_server


@router.post("/", response_model=MCPServerOut)
def create_mcp_server(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    mcp_server_in: MCPServerCreate,
) -> Any:
    """
    Create new MCP server.
    """
    mcp_server = MCPServer.model_validate(mcp_server_in)
    mcp_server.owner_id = current_user.id
    session.add(mcp_server)
    session.commit()
    session.refresh(mcp_server)
    return mcp_server


@router.put("/{id}", response_model=MCPServerOut)
def update_mcp_server(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: str,
    mcp_server_in: MCPServerUpdate,
) -> Any:
    """
    Update an MCP server.
    """
    mcp_server = session.get(MCPServer, id)
    if not mcp_server:
        raise HTTPException(status_code=404, detail="MCP server not found")
    if not current_user.is_superuser and mcp_server.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Only update the fields that were provided
    update_dict = mcp_server_in.model_dump(exclude_unset=True)
    if update_dict:
        mcp_server.sqlmodel_update(update_dict)
        session.add(mcp_server)
        session.commit()
        session.refresh(mcp_server)

    return mcp_server


@router.delete("/{id}")
def delete_mcp_server(
    session: SessionDep, current_user: CurrentUser, id: str
) -> UtilsMessage:
    """
    Delete an MCP server.
    """
    mcp_server = session.get(MCPServer, id)
    if not mcp_server:
        raise HTTPException(status_code=404, detail="MCP server not found")
    if not current_user.is_superuser and mcp_server.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(mcp_server)
    session.commit()
    return UtilsMessage(message="MCP server deleted successfully")

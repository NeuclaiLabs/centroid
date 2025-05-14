from typing import Any, Literal

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    MCPServer,
    MCPServerCreate,
    MCPServerOut,
    MCPServerOutWithTemplate,
    MCPServersOut,
    MCPServersOutWithTemplate,
    MCPServerState,
    MCPServerStatus,
    MCPServerUpdate,
    UtilsMessage,
)

router = APIRouter()


# Helper function to get MCP server or raise 404


@router.get("/", response_model=MCPServersOut)
def read_mcp_servers(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    template_id: str | None = None,
) -> Any:
    """
    Retrieve MCP servers.
    All search parameters are optional and will be automatically parsed from query parameters.
    """
    # Build base query
    query = select(MCPServer).where(MCPServer.owner_id == current_user.id)

    # Add template_id filter if provided
    if template_id:
        query = query.where(MCPServer.template_id == template_id)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count = session.exec(count_query).one()

    # Get paginated results
    query = query.offset(skip).limit(limit)
    mcp_servers = session.exec(query).all()

    data = [MCPServerOut.model_validate(server.model_dump()) for server in mcp_servers]
    return MCPServersOut(data=data, count=count)


@router.get("/templates", response_model=MCPServersOutWithTemplate)
def read_mcp_servers_with_templates(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve MCP servers with their template information.
    Returns a simplified view containing only server IDs and their associated template IDs.
    """
    # Build base query for servers with templates
    query = (
        select(MCPServer.id, MCPServer.template_id)
        .where(MCPServer.owner_id == current_user.id)
        .where(MCPServer.template_id.is_not(None))
    )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count = session.exec(count_query).one()

    # Get paginated results
    query = query.offset(skip).limit(limit)
    results = session.exec(query).all()

    # Convert results to MCPServerOutWithTemplate objects
    servers_with_templates = [
        MCPServerOutWithTemplate(id=id, template_id=template_id)
        for id, template_id in results
    ]

    return MCPServersOutWithTemplate(data=servers_with_templates, count=count)


@router.get("/{id}", response_model=MCPServerOut)
def read_mcp_server(session: SessionDep, current_user: CurrentUser, id: str) -> Any:
    """
    Get MCP server by ID.
    """
    db_mcp_server = session.get(MCPServer, id)

    if not db_mcp_server:
        raise HTTPException(status_code=404, detail="MCP server not found")
    if not current_user.is_superuser and db_mcp_server.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return MCPServerOut.model_validate(db_mcp_server.model_dump())


@router.post("/", response_model=MCPServerOut)
async def create_mcp_server(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    mcp_server_in: MCPServerCreate,
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Create new MCP server.
    """
    from app.mcp.manager import MCPManager

    # Create the server instance
    db_mcp_server = MCPServer(
        **mcp_server_in.model_dump(exclude_unset=True), owner_id=current_user.id
    )

    # Add to database
    session.add(db_mcp_server)
    session.commit()
    session.refresh(db_mcp_server)

    # Create a validated model for the background task
    mcp_server = MCPServer.model_validate(db_mcp_server)

    # Start the server in the background only after DB commit is complete
    if mcp_server.status == MCPServerStatus.ACTIVE:
        background_tasks.add_task(MCPManager.get_singleton().start_server, mcp_server)

    return MCPServerOut.model_validate(
        {**mcp_server.model_dump(), "state": "initializing"}
    )


@router.put("/{id}", response_model=MCPServerOut)
async def update_mcp_server(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: str,
    mcp_server_in: MCPServerUpdate,
) -> Any:
    """
    Update an MCP server.
    """

    # Get the raw database instance
    db_mcp_server = session.get(MCPServer, id)
    if not db_mcp_server:
        raise HTTPException(status_code=404, detail="MCP server not found")
    if not current_user.is_superuser and db_mcp_server.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Only update the fields that were provided
    update_dict = mcp_server_in.model_dump(exclude_unset=True)

    # Handle secrets separately since it's a property with custom getter/setter
    if "secrets" in update_dict:
        # This will use the property setter which handles encryption
        db_mcp_server.secrets = update_dict.pop("secrets")

    # Update the remaining fields
    if update_dict:
        db_mcp_server.sqlmodel_update(update_dict)

    # Commit changes to database first
    session.add(db_mcp_server)
    session.commit()
    session.refresh(db_mcp_server)

    return MCPServerOut.model_validate(db_mcp_server.model_dump())


@router.delete("/{id}")
async def delete_mcp_server(
    session: SessionDep,
    current_user: CurrentUser,
    id: str,
    background_tasks: BackgroundTasks,
) -> UtilsMessage:
    """
    Delete an MCP server.
    """
    from app.mcp.manager import MCPManager

    # Get the raw database instance
    db_mcp_server = session.get(MCPServer, id)
    if not db_mcp_server:
        raise HTTPException(status_code=404, detail="MCP server not found")
    if not current_user.is_superuser and db_mcp_server.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Create a validated model for the background task before deletion
    mcp_server = MCPServer.model_validate(db_mcp_server)

    # Delete from database first
    session.delete(db_mcp_server)
    session.commit()

    # Stop the server in the background only after DB commit is complete
    background_tasks.add_task(MCPManager.get_singleton().stop_server, mcp_server)

    return UtilsMessage(message="MCP server deleted successfully")


@router.post("/{id}/{action}", response_model=MCPServerOut)
async def mcp_server_action(
    session: SessionDep,
    current_user: CurrentUser,
    id: str,
    action: Literal["start", "stop", "restart"],
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Perform an action on an MCP server.

    - action: The action to perform (start, stop, restart)
    """
    from app.mcp.manager import MCPManager

    # Get the raw database instance
    db_mcp_server = session.get(MCPServer, id)
    if not db_mcp_server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="MCP server not found"
        )
    if not current_user.is_superuser and db_mcp_server.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    # Create a validated model for the action
    server = MCPServer.model_validate(db_mcp_server)
    manager = MCPManager.get_singleton()

    # Map action to valid server state
    action_state_map = {
        "start": MCPServerState.INITIALIZING,
        "stop": MCPServerState.STOPPING,
        "restart": MCPServerState.RESTARTING,
    }

    state = action_state_map[action]

    # Schedule the action to run in the background
    match action:
        case "start":
            background_tasks.add_task(manager.start_server, server)
        case "stop":
            background_tasks.add_task(manager.stop_server, server)
        case "restart":
            background_tasks.add_task(manager.restart_server, server)
        case _:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported action: {action}",
            )

    # Return current state immediately, the actual action happens in background
    return MCPServerOut.model_validate({**server.model_dump(), "state": state})

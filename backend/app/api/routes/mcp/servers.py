from typing import Any, Literal

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.core.logger import get_logger
from app.mcp.manager import MCPManager
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
    MCPTool,
    UtilsMessage,
)

logger = get_logger(__name__)

router = APIRouter()


# Helper function to get MCP server or raise 404


@router.get("/", response_model=MCPServersOut)
def read_mcp_servers(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    template_id: str | None = None,
    is_agent: bool = False,
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

    query = query.where(MCPServer.is_agent == is_agent)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count = session.exec(count_query).one()

    # Get paginated results
    query = query.offset(skip).limit(limit)
    mcp_servers_orm = session.exec(query).all()

    data = [MCPServerOut.model_validate(server_orm) for server_orm in mcp_servers_orm]
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
    db_mcp_server_orm = session.get(MCPServer, id)

    if not db_mcp_server_orm:
        raise HTTPException(status_code=404, detail="MCP server not found")
    if not current_user.is_superuser and db_mcp_server_orm.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return MCPServerOut.model_validate(db_mcp_server_orm)


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
    # Resolve secrets first
    from app.models.mcp.server import resolve_secrets

    server_data = mcp_server_in.model_dump(exclude_unset=True)
    resolved_secrets = None

    if mcp_server_in.secrets:
        resolved_secrets = resolve_secrets(
            mcp_server_in.secrets, session, current_user.id
        )
        # Replace the secrets in server_data with resolved values
        server_data["secrets"] = resolved_secrets

    # Create the server instance
    db_mcp_server_orm = MCPServer(**server_data, owner_id=current_user.id)

    # Add to database
    session.add(db_mcp_server_orm)
    session.commit()
    session.refresh(db_mcp_server_orm)

    # Create a validated ORM model for the background task & output conversion
    mcp_server_orm = MCPServer.model_validate(db_mcp_server_orm)

    # Start the server in the background only after DB commit is complete
    if mcp_server_orm.status == MCPServerStatus.ACTIVE:
        background_tasks.add_task(
            MCPManager.get_singleton().start_server, mcp_server_orm
        )

    # Create the output model from the ORM instance
    out_server = MCPServerOut.model_validate(mcp_server_orm)
    # Set the initial state for the response, as the server is just starting
    out_server.state = MCPServerState.INITIALIZING
    return out_server


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
    db_mcp_server_orm = session.get(MCPServer, id)
    if not db_mcp_server_orm:
        raise HTTPException(status_code=404, detail="MCP server not found")
    if not current_user.is_superuser and db_mcp_server_orm.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Only update the fields that were provided
    update_dict = mcp_server_in.model_dump(exclude_unset=True)

    # Handle secrets separately since it's a property with custom getter/setter
    if mcp_server_in.secrets is not None:
        # Resolve secrets first
        from app.models.mcp.server import resolve_secrets

        resolved_secrets = resolve_secrets(
            mcp_server_in.secrets, session, current_user.id
        )
        # This will use the property setter which handles encryption
        db_mcp_server_orm.secrets = resolved_secrets

        # Remove secrets from update_dict since we handled it separately
        update_dict.pop("secrets", None)

    # Update the remaining fields
    if update_dict:
        db_mcp_server_orm.sqlmodel_update(update_dict)

    # Commit changes to database first
    session.add(db_mcp_server_orm)
    session.commit()
    session.refresh(db_mcp_server_orm)

    return MCPServerOut.model_validate(db_mcp_server_orm)


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
    # Get the raw database instance
    db_mcp_server_orm = session.get(MCPServer, id)
    if not db_mcp_server_orm:
        raise HTTPException(status_code=404, detail="MCP server not found")
    if not current_user.is_superuser and db_mcp_server_orm.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Create a validated model for the background task before deletion
    mcp_server_orm = MCPServer.model_validate(db_mcp_server_orm)

    # Delete from database first
    session.delete(db_mcp_server_orm)
    session.commit()

    # Stop the server in the background only after DB commit is complete
    background_tasks.add_task(MCPManager.get_singleton().stop_server, mcp_server_orm)

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
    # Get the raw database instance
    db_mcp_server_orm = session.get(MCPServer, id)
    if not db_mcp_server_orm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="MCP server not found"
        )
    if not current_user.is_superuser and db_mcp_server_orm.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    # Create a validated ORM model for the action and background task
    server_orm = MCPServer.model_validate(db_mcp_server_orm)
    manager = MCPManager.get_singleton()

    # Map action to the state that will be reflected in the response
    action_to_response_state_map = {
        "start": MCPServerState.INITIALIZING,
        "stop": MCPServerState.STOPPING,
        "restart": MCPServerState.RESTARTING,
    }

    response_state = action_to_response_state_map[action]

    # Schedule the actual action to run in the background
    match action:
        case "start":
            background_tasks.add_task(manager.start_server, server_orm)
        case "stop":
            background_tasks.add_task(manager.stop_server, server_orm)
        case "restart":
            background_tasks.add_task(manager.restart_server, server_orm)
        case _:  # Should not be reached due to Literal type hint and FastAPI validation
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported action: {action}",
            )

    # Create the output model from the ORM instance
    out_server = MCPServerOut.model_validate(server_orm)
    # Set the state for the response based on the action initiated
    out_server.state = response_state
    return out_server


@router.get("/{id}/tools", response_model=list[MCPTool])
async def read_mcp_server_tools(
    session: SessionDep,
    current_user: CurrentUser,
    id: str,
) -> Any:
    """
    Get available tools for a specific MCP server.

    Returns a list of tools available for the specified server, with their current status.
    """
    # Get the server from the database
    db_mcp_server_orm = session.get(MCPServer, id)
    if not db_mcp_server_orm:
        raise HTTPException(status_code=404, detail="MCP server not found")
    if not current_user.is_superuser and db_mcp_server_orm.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Validate the ORM instance
    server_orm = MCPServer.model_validate(db_mcp_server_orm)

    # Get the MCP manager and proxy
    manager = MCPManager.get_singleton()
    proxy = manager.get_mcp_proxy(server_orm.id)

    if not proxy:
        logger.error(f"MCP proxy not found for server {server_orm.id}")
        # If proxy doesn't exist or is not initialized, return just the configured tools
        return server_orm.tools or []

    try:
        # Get tools from the proxy
        tools_dict = await proxy.get_tools()

        # Convert dictionary to list of MCPTool objects
        result = []

        for name, tool in tools_dict.items():  # Otherwise, assume it's enabled
            result.append(
                MCPTool(
                    name=name,
                    description=tool.description,
                    status=True,
                    parameters=tool.parameters,
                )
            )

        return result

    except Exception as e:
        logger.error(f"Error getting tools for server {server_orm.id}: {e}")
        # On error, return just the configured tools
        return server_orm.tools or []

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.core.logger import get_logger
from app.models import (
    Connection,
    ConnectionCreate,
    ConnectionOut,
    ConnectionSearch,
    ConnectionsOut,
    ConnectionUpdate,
    ToolDefinition,
    ToolInstance,
    ToolInstanceStatus,
    UtilsMessage,
)

router = APIRouter()
logger = get_logger(__name__, service="connections")


def get_connection(
    session: SessionDep, connection_id: str, current_user: CurrentUser
) -> Connection:
    """Get a connection by ID or raise 404."""
    connection = session.get(Connection, connection_id)
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found"
        )
    if not current_user.is_superuser and (connection.owner_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    return connection


def create_tool_instances_for_connection(
    session: SessionDep,
    connection: Connection,
    owner_id: str,
) -> list[ToolInstance]:
    """
    Create tool instances for all tool definitions matching the connection's app_id.

    Args:
        session: The database session
        connection: The connection to create tool instances for
        owner_id: The ID of the user who will own the tool instances

    Returns:
        list[ToolInstance]: The created tool instances

    Raises:
        Exception: If there's an error creating the tool instances
    """
    # Find all tool definitions for this app
    tool_definitions = session.exec(
        select(ToolDefinition).where(ToolDefinition.app_id == connection.app_id)
    ).all()

    tool_instances = []
    # Create tool instances for each definition
    for definition in tool_definitions:
        # Get status from defaults, fallback to INACTIVE if not specified
        status = (
            ToolInstanceStatus.ACTIVE
            if definition.tool_metadata.get("defaults", {}).get("status") == "active"
            else ToolInstanceStatus.INACTIVE
        )

        tool_instance = ToolInstance(
            definition_id=definition.id,
            definition=definition,
            status=status,
            owner_id=owner_id,
            app_id=connection.app_id,
            config={
                "connection_id": connection.id,
            },
        )
        session.add(tool_instance)
        tool_instances.append(tool_instance)

    return tool_instances


def delete_tool_instances_for_connection(
    session: SessionDep,
    connection: Connection,
) -> None:
    """
    Delete all tool instances associated with a connection.

    Args:
        session: The database session
        connection: The connection whose tool instances should be deleted

    Raises:
        Exception: If there's an error deleting the tool instances
    """
    # Find all tool instances with this connection_id in their config
    # Using SQLite's json_extract function for JSON querying
    tool_instances = session.exec(
        select(ToolInstance).where(
            func.json_extract(ToolInstance.config, "$.connection_id") == connection.id
        )
    ).all()

    # Delete each tool instance
    for tool_instance in tool_instances:
        session.delete(tool_instance)


@router.post("/", response_model=ConnectionOut)
def create_connection(
    session: SessionDep,
    connection_in: ConnectionCreate,
    current_user: CurrentUser,
) -> ConnectionOut:
    """Create new connection and associated tool instances."""
    try:
        # Create the connection
        connection = Connection.model_validate(connection_in)
        connection.owner_id = current_user.id

        # Explicitly set auth if provided
        if connection_in.auth:
            connection.auth = connection_in.auth

        session.add(connection)
        session.flush()  # Get the ID without committing

        # Create tool instances
        create_tool_instances_for_connection(
            session=session,
            connection=connection,
            owner_id=current_user.id,
        )

        # Commit all changes
        session.commit()
        session.refresh(connection)

        return ConnectionOut.model_validate(connection)
    except Exception as e:
        logger.error(f"Failed to create connection and tool instances: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create connection and tool instances: {str(e)}",
        )


@router.get("/", response_model=ConnectionsOut)
def read_connections(
    session: SessionDep,
    current_user: CurrentUser,
    search: ConnectionSearch = Depends(),
    skip: int = 0,
    limit: int = 100,
) -> ConnectionsOut:
    """Retrieve connections with pagination."""
    try:
        # Build base query with owner filter
        statement = select(Connection).where(Connection.owner_id == current_user.id)

        # Add app_id filter if provided
        if search.app_id:
            statement = statement.where(Connection.app_id == search.app_id)

        # Get total count
        count = session.exec(
            select(func.count()).select_from(statement.subquery())
        ).one()

        # Get paginated results
        connections = session.exec(statement.offset(skip).limit(limit)).all()

        # Convert to output models
        connections_out = [ConnectionOut.model_validate(conn) for conn in connections]

        return ConnectionsOut(data=connections_out, count=count)
    except Exception as e:
        logger.error(f"Failed to fetch connections: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch connections: {str(e)}",
        )


@router.get("/{connection_id}", response_model=ConnectionOut)
def read_connection(
    session: SessionDep,
    connection_id: str,
    current_user: CurrentUser,
) -> ConnectionOut:
    """Get connection by ID."""
    connection = get_connection(session, connection_id, current_user)
    return ConnectionOut.model_validate(connection)


@router.put("/{connection_id}", response_model=ConnectionOut)
def update_connection(
    session: SessionDep,
    connection_id: str,
    connection_in: ConnectionUpdate,
    current_user: CurrentUser,
) -> ConnectionOut:
    """Update a connection."""
    connection = get_connection(session, connection_id, current_user)

    # Only update fields that were actually provided
    update_data = connection_in.model_dump(exclude_unset=True, by_alias=False)
    # Prevent owner_id from being updated
    update_data.pop("ownerId", None)

    # Handle auth update explicitly since it needs special handling for encryption
    if "auth" in update_data:
        connection.auth = update_data.pop("auth")

    # Update remaining fields
    if update_data:
        connection.sqlmodel_update(update_data)

    session.add(connection)
    session.commit()
    session.refresh(connection)

    return ConnectionOut.model_validate(connection)


@router.delete(
    "/{connection_id}",
    response_model=UtilsMessage,
    status_code=status.HTTP_200_OK,
)
def delete_connection(
    session: SessionDep,
    connection_id: str,
    current_user: CurrentUser,
) -> UtilsMessage:
    """Delete a connection and its associated tool instances."""
    try:
        connection = get_connection(session, connection_id, current_user)

        # First delete associated tool instances
        delete_tool_instances_for_connection(session, connection)

        # Then delete the connection
        session.delete(connection)
        session.commit()
        return UtilsMessage(
            message="Connection and associated tool instances deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete connection {connection_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete connection: {str(e)}",
        )

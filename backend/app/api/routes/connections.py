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


@router.post("/", response_model=ConnectionOut)
def create_connection(
    session: SessionDep,
    connection_in: ConnectionCreate,
    current_user: CurrentUser,
) -> ConnectionOut:
    """Create new connection."""
    try:
        # Create the connection
        connection = Connection.model_validate(connection_in)
        connection.owner_id = current_user.id

        # Explicitly set auth if provided
        if connection_in.auth:
            connection.auth = connection_in.auth

        session.add(connection)
        session.commit()
        session.refresh(connection)

        return ConnectionOut.model_validate(connection)
    except Exception as e:
        logger.error(f"Failed to create connection: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create connection: {str(e)}",
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

        # Add provider_id filter if provided
        if search.provider_id:
            statement = statement.where(Connection.provider_id == search.provider_id)

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
    """Delete a connection."""
    try:
        connection = get_connection(session, connection_id, current_user)
        session.delete(connection)
        session.commit()
        return UtilsMessage(message="Connection deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete connection {connection_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete connection: {str(e)}",
        )

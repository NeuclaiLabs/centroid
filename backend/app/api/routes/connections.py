from fastapi import APIRouter, HTTPException, status
from sqlmodel import func, select

from app.api.deps import SessionDep
from app.core.logger import get_logger
from app.models import (
    Connection,
    ConnectionCreate,
    ConnectionOut,
    ConnectionsOut,
    ConnectionUpdate,
    UtilsMessage,
)

router = APIRouter()
logger = get_logger(__name__, service="connections")


def get_connection(session: SessionDep, connection_id: str) -> Connection:
    """Get a connection by ID or raise 404."""
    connection = session.get(Connection, connection_id)
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found"
        )
    return connection


@router.post("/", response_model=ConnectionOut)
def create_connection(
    session: SessionDep,
    connection_in: ConnectionCreate,
) -> ConnectionOut:
    """Create new connection."""
    try:
        # Convert input model to DB model
        connection = Connection.model_validate(connection_in)
        session.add(connection)
        session.commit()
        session.refresh(connection)

        # Convert DB model to output model
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
    skip: int = 0,
    limit: int = 100,
) -> ConnectionsOut:
    """Retrieve connections with pagination."""
    try:
        # Build base query
        statement = select(Connection)

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
) -> ConnectionOut:
    """Get connection by ID."""
    connection = get_connection(session, connection_id)
    return ConnectionOut.model_validate(connection)


@router.put("/{connection_id}", response_model=ConnectionOut)
def update_connection(
    session: SessionDep,
    connection_id: str,
    connection_in: ConnectionUpdate,
) -> ConnectionOut:
    """Update a connection."""
    try:
        connection = get_connection(session, connection_id)

        # Only update fields that were actually provided
        update_data = connection_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(connection, field, value)

        session.add(connection)
        session.commit()
        session.refresh(connection)

        return ConnectionOut.model_validate(connection)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update connection {connection_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update connection: {str(e)}",
        )


@router.delete(
    "/{connection_id}",
    response_model=UtilsMessage,
    status_code=status.HTTP_200_OK,
)
def delete_connection(
    session: SessionDep,
    connection_id: str,
) -> UtilsMessage:
    """Delete a connection."""
    try:
        connection = get_connection(session, connection_id)
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

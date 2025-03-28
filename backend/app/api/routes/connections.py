from typing import Any

from fastapi import APIRouter, HTTPException
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
    connection = session.get(Connection, connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    return connection


@router.post("/", response_model=ConnectionOut)
def create_connection(*, session: SessionDep, connection_in: ConnectionCreate) -> Any:
    """Create new connection."""
    try:
        connection = Connection.model_validate(connection_in.model_dump())
        session.add(connection)
        session.commit()
        session.refresh(connection)
        return ConnectionOut.model_validate(connection.model_dump())
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create connection: {str(e)}",
        )


@router.get("/", response_model=ConnectionsOut)
def read_connections(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Retrieve connections."""
    statement = select(Connection)
    count = session.exec(select(func.count()).select_from(statement.subquery())).one()
    connections = session.exec(statement.offset(skip).limit(limit)).all()
    connections_out = [
        ConnectionOut.model_validate(conn.model_dump()) for conn in connections
    ]
    return ConnectionsOut(data=connections_out, count=count)


@router.get("/{connection_id}", response_model=ConnectionOut)
def read_connection(*, session: SessionDep, connection_id: str) -> Any:
    """Get connection by ID."""
    connection = get_connection(session, connection_id)
    return ConnectionOut.model_validate(connection.model_dump())


@router.put("/{connection_id}", response_model=ConnectionOut)
def update_connection(
    *,
    session: SessionDep,
    connection_id: str,
    connection_in: ConnectionUpdate,
) -> Any:
    """Update a connection."""
    connection = get_connection(session, connection_id)

    update_data = connection_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(connection, field, value)

    session.add(connection)
    session.commit()
    session.refresh(connection)
    return ConnectionOut.model_validate(connection.model_dump())


@router.delete("/{connection_id}", response_model=UtilsMessage)
def delete_connection(*, session: SessionDep, connection_id: str) -> Any:
    """Delete a connection."""
    connection = get_connection(session, connection_id)
    session.delete(connection)
    session.commit()
    return UtilsMessage(message="Connection deleted successfully")

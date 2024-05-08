from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Connection,
    ConnectionCreate,
    ConnectionOut,
    ConnectionsOut,
    ConnectionUpdate,
    Message,
)

router = APIRouter()


@router.get("/", response_model=ConnectionsOut)
def read_connections(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """Retrieve connections."""
    if current_user.is_superuser:
        statement = select(func.count()).select_from(Connection)
        count = session.exec(statement).one()
        statement = select(Connection).offset(skip).limit(limit)
        connections = session.exec(statement).all()
    else:
        statement = (
            select(func.count())
            .select_from(Connection)
            .where(Connection.owner_id == current_user.id)
        )
        count = session.exec(statement).one()
        statement = (
            select(Connection)
            .where(Connection.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        connections = session.exec(statement).all()
    return ConnectionsOut(data=connections, count=count)


@router.get("/{id}", response_model=ConnectionOut)
def read_connection(session: SessionDep, current_user: CurrentUser, id: str) -> Any:
    """Get connection by ID."""
    connection = session.get(Connection, id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    if not current_user.is_superuser and (connection.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return connection


@router.post("/", response_model=ConnectionOut)
def create_connection(
    *, session: SessionDep, current_user: CurrentUser, connection_in: ConnectionCreate
) -> Any:
    """Create new connection."""
    connection = Connection.model_validate(
        connection_in, update={"owner_id": current_user.id}
    )
    session.add(connection)
    session.commit()
    session.refresh(connection)
    return connection


@router.put("/{id}", response_model=ConnectionOut)
def update_connection(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: str,
    connection_in: ConnectionUpdate,
) -> Any:
    """Update a connection."""
    connection = session.get(Connection, id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    if not current_user.is_superuser and (connection.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = connection_in.model_dump(exclude_unset=True)
    connection.sqlmodel_update(update_dict)
    session.add(connection)
    session.commit()
    session.refresh(connection)
    return connection


@router.delete("/{id}")
def delete_connection(
    session: SessionDep, current_user: CurrentUser, id: str
) -> Message:
    """Delete a connection."""
    connection = session.get(Connection, id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    if not current_user.is_superuser and (connection.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(connection)
    session.commit()
    return Message(message="Connection deleted successfully")

from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    Setting,
    ToolCall,
    ToolCallCreate,
    ToolCallOut,
    ToolCallsOut,
    ToolCallUpdate,
)

router = APIRouter()


@router.get("/", response_model=ToolCallsOut)
def read_tool_calls(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Retrieve tool calls."""
    if current_user.is_superuser:
        statement = select(func.count()).select_from(ToolCall)
        count = session.exec(statement).one()
        statement = select(ToolCall).offset(skip).limit(limit)
        tool_calls = session.exec(statement).all()
    else:
        statement = (
            select(func.count())
            .select_from(ToolCall)
            .where(ToolCall.owner_id == current_user.id)
        )
        count = session.exec(statement).one()
        statement = (
            select(ToolCall)
            .where(ToolCall.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        tool_calls = session.exec(statement).all()
    return ToolCallsOut(data=tool_calls, count=count)


@router.get("/{id}", response_model=ToolCallOut)
def read_tool_call(session: SessionDep, current_user: CurrentUser, id: str) -> Any:
    """Get tool call by ID."""
    tool_call = session.get(ToolCall, id)
    if not tool_call:
        raise HTTPException(status_code=404, detail="Tool call not found")
    if not current_user.is_superuser and (tool_call.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return tool_call


@router.post("/", response_model=ToolCallOut)
def create_tool_call(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tool_call_in: ToolCallCreate,
) -> Any:
    """Create new tool call."""
    tool_call = ToolCall.model_validate(
        tool_call_in, update={"owner_id": current_user.id}
    )
    session.add(tool_call)
    session.commit()
    session.refresh(tool_call)
    statement = select(Setting).where(Setting.owner_id == current_user.id)
    settings = session.exec(statement).first()
    print(settings)
    # ToolRunner(config=settings, context=tool_call_in.payload, name=tool_call.kind).run()
    return tool_call


@router.put("/{id}", response_model=ToolCallOut)
def update_tool_call(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: str,
    tool_call_in: ToolCallUpdate,
) -> Any:
    """Update a tool call."""
    tool_call = session.get(ToolCall, id)
    if not tool_call:
        raise HTTPException(status_code=404, detail="Tool call not found")
    if not current_user.is_superuser and (tool_call.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = tool_call_in.model_dump(exclude_unset=True)
    tool_call.sqlmodel_update(update_dict)
    session.add(tool_call)
    session.commit()
    session.refresh(tool_call)
    return tool_call


@router.delete("/{id}")
def delete_tool_call(
    session: SessionDep, current_user: CurrentUser, id: str
) -> Message:
    """Delete a tool call."""
    tool_call = session.get(ToolCall, id)
    if not tool_call:
        raise HTTPException(status_code=404, detail="Tool call not found")
    if not current_user.is_superuser and (tool_call.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(tool_call)
    session.commit()
    return Message(message="Tool call deleted successfully")

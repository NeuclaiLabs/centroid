from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import SessionDep
from app.models import (
    ToolDefinition,
    ToolDefinitionCreate,
    ToolDefinitionOut,
    ToolDefinitionsOut,
    ToolDefinitionUpdate,
    UtilsMessage,
)

router = APIRouter()


@router.get("/", response_model=ToolDefinitionsOut)
def read_tool_definitions(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve tool definitions.
    """

    statement = select(func.count()).select_from(ToolDefinition)
    count = session.exec(statement).one()
    statement = select(ToolDefinition).offset(skip).limit(limit)
    tools = session.exec(statement).all()

    return ToolDefinitionsOut(data=tools, count=count)


@router.get("/{id}", response_model=ToolDefinitionOut)
def read_tool_definition(session: SessionDep, id: str) -> Any:
    """
    Get tool definition by ID.
    """
    tool = session.get(ToolDefinition, id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool


@router.post("/", response_model=ToolDefinitionOut)
def create_tool_definition(
    *, session: SessionDep, tool_in: ToolDefinitionCreate
) -> Any:
    """
    Create new tool definition.
    """
    tool = ToolDefinition.model_validate(tool_in)
    session.add(tool)
    session.commit()
    session.refresh(tool)
    return tool


@router.put("/{id}", response_model=ToolDefinitionOut)
def update_tool_definition(
    *,
    session: SessionDep,
    id: str,
    tool_in: ToolDefinitionUpdate,
) -> Any:
    """
    Update a tool definition.
    """
    tool = session.get(ToolDefinition, id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    update_data = tool_in.model_dump(exclude_unset=True, by_alias=False)
    tool.sqlmodel_update(update_data)

    session.add(tool)
    session.commit()
    session.refresh(tool)
    return tool


@router.delete("/{id}")
def delete_tool_definition(session: SessionDep, id: str) -> UtilsMessage:
    """
    Delete a tool definition.
    """
    tool = session.get(ToolDefinition, id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    session.delete(tool)
    session.commit()
    return UtilsMessage(message="Tool deleted successfully")

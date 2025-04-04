from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    ToolDefinition,
    ToolDefinitionCreate,
    ToolDefinitionOut,
    ToolDefinitionSearch,
    ToolDefinitionsOut,
    ToolDefinitionUpdate,
    UtilsMessage,
)

router = APIRouter()


@router.get("/", response_model=ToolDefinitionsOut)
def read_tool_definitions(
    session: SessionDep,
    current_user: CurrentUser,
    search: ToolDefinitionSearch = Depends(),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve tool definitions.
    All search parameters are optional and will be automatically parsed from query parameters.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    query = select(ToolDefinition)
    if search.app_id:
        query = query.where(ToolDefinition.app_id == search.app_id)

    count_query = select(func.count()).select_from(query.subquery())
    count = session.exec(count_query).one()

    query = query.offset(skip).limit(limit)
    tools = session.exec(query).all()

    return ToolDefinitionsOut(data=tools, count=count)


@router.get("/{id}", response_model=ToolDefinitionOut)
def read_tool_definition(
    session: SessionDep, current_user: CurrentUser, id: str
) -> Any:
    """
    Get tool definition by ID.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    tool = session.get(ToolDefinition, id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool


@router.post("/", response_model=ToolDefinitionOut)
def create_tool_definition(
    *, session: SessionDep, current_user: CurrentUser, tool_in: ToolDefinitionCreate
) -> Any:
    """
    Create new tool definition.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    tool = ToolDefinition.model_validate(tool_in)
    session.add(tool)
    session.commit()
    session.refresh(tool)
    return tool


@router.put("/{id}", response_model=ToolDefinitionOut)
def update_tool_definition(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: str,
    tool_in: ToolDefinitionUpdate,
) -> Any:
    """
    Update a tool definition.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
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
def delete_tool_definition(
    session: SessionDep, current_user: CurrentUser, id: str
) -> UtilsMessage:
    """
    Delete a tool definition.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    tool = session.get(ToolDefinition, id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    session.delete(tool)
    session.commit()
    return UtilsMessage(message="Tool deleted successfully")

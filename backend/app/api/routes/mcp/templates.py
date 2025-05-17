"""Routes for MCP templates."""

from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.core.logger import get_logger
from app.models import (
    MCPTemplate,
    MCPTemplateCreate,
    MCPTemplateOut,
    MCPTemplatesOut,
    MCPTemplateUpdate,
    UtilsMessage,
)

logger = get_logger(__name__)

router = APIRouter()


@router.get("/", response_model=MCPTemplatesOut)
def read_mcp_templates(
    session: SessionDep,
    current_user: CurrentUser,  # noqa: ARG001
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve MCP templates.
    All search parameters are optional and will be automatically parsed from query parameters.
    """
    # Build base query - all users can access all templates
    query = select(MCPTemplate)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count = session.exec(count_query).one()

    # Get paginated results
    query = query.offset(skip).limit(limit)
    mcp_templates = session.exec(query).all()

    return MCPTemplatesOut(
        data=[MCPTemplateOut.model_validate(template) for template in mcp_templates],
        count=count,
    )


@router.get("/{id}", response_model=MCPTemplateOut)
def read_mcp_template(
    session: SessionDep,
    current_user: CurrentUser,  # noqa: ARG001
    id: str,
) -> Any:
    """
    Get MCP template by ID.
    """
    db_mcp_template = session.get(MCPTemplate, id)

    if not db_mcp_template:
        raise HTTPException(status_code=404, detail="MCP template not found")

    return MCPTemplateOut.model_validate(db_mcp_template)


@router.post("/", response_model=MCPTemplateOut)
def create_mcp_template(
    session: SessionDep,
    current_user: CurrentUser,
    mcp_template_in: MCPTemplateCreate,
) -> Any:
    """
    Create new MCP template.
    Only superusers can create templates.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Check if a template with this ID already exists
    existing_template = session.get(MCPTemplate, mcp_template_in.id)
    if existing_template:
        raise HTTPException(
            status_code=400,
            detail=f"A template with the ID '{mcp_template_in.id}' already exists",
        )

    # Create the template instance
    db_mcp_template = MCPTemplate(**mcp_template_in.model_dump())

    # Add to database
    session.add(db_mcp_template)
    session.commit()
    session.refresh(db_mcp_template)

    return MCPTemplateOut.model_validate(db_mcp_template)


@router.put("/{id}", response_model=MCPTemplateOut)
def update_mcp_template(
    session: SessionDep,
    current_user: CurrentUser,
    id: str,
    mcp_template_in: MCPTemplateUpdate,
) -> Any:
    """
    Update an MCP template.
    Only superusers can update templates.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Get the database instance
    db_mcp_template = session.get(MCPTemplate, id)
    if not db_mcp_template:
        raise HTTPException(status_code=404, detail="MCP template not found")

    # Only update the fields that were provided
    update_dict = mcp_template_in.model_dump(exclude_unset=True)

    # Update the fields
    if update_dict:
        db_mcp_template.sqlmodel_update(update_dict)

    # Commit changes to database
    session.add(db_mcp_template)
    session.commit()
    session.refresh(db_mcp_template)

    return MCPTemplateOut.model_validate(db_mcp_template)


@router.delete("/{id}", response_model=UtilsMessage)
def delete_mcp_template(
    session: SessionDep,
    current_user: CurrentUser,
    id: str,
) -> Any:
    """
    Delete an MCP template.
    Only superusers can delete templates.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Get the database instance
    db_mcp_template = session.get(MCPTemplate, id)
    if not db_mcp_template:
        raise HTTPException(status_code=404, detail="MCP template not found")

    # Delete from database
    session.delete(db_mcp_template)
    session.commit()

    return UtilsMessage(message="MCP template deleted successfully")

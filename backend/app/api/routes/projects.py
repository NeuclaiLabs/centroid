from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.api.routes.teams import check_team_permissions
from app.models import (
    Message,
    Project,
    ProjectCreate,
    ProjectOut,
    ProjectsOut,
    ProjectUpdate,
    TeamRole,
)

router = APIRouter()


def get_project(session: SessionDep, project_id: str) -> Project:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/", response_model=ProjectOut)
def create_project(
    *, session: SessionDep, current_user: CurrentUser, project_in: ProjectCreate
) -> Any:
    """Create new project."""
    # Check if user has permission to create project in this team
    check_team_permissions(
        session, project_in.team_id, current_user.id, [TeamRole.OWNER, TeamRole.ADMIN]
    )

    project = Project.model_validate(project_in)
    session.add(project)
    session.commit()
    session.refresh(project)

    return ProjectOut.model_validate(project)


@router.get("/", response_model=ProjectsOut)
def read_projects(
    session: SessionDep,
    current_user: CurrentUser,
    team_id: str,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Retrieve projects."""

    # Check team permissions first
    check_team_permissions(session, team_id, current_user.id)
    statement = select(Project).where(Project.team_id == team_id)

    count = session.exec(select(func.count()).select_from(statement.subquery())).one()
    projects = session.exec(statement.offset(skip).limit(limit)).all()
    return ProjectsOut(data=projects, count=count)


@router.get("/{project_id}", response_model=ProjectOut)
def read_project(
    *, session: SessionDep, current_user: CurrentUser, project_id: str
) -> Any:
    """Get project by ID."""
    project = get_project(session, project_id)
    # Check if user has access to this project's team
    check_team_permissions(session, project.team_id, current_user.id)
    return project


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_id: str,
    project_in: ProjectUpdate,
) -> Any:
    """Update a project."""
    print("Updating project", project_id, project_in)
    project = get_project(session, project_id)
    # Check if user has admin permissions in the team
    check_team_permissions(
        session, project.team_id, current_user.id, [TeamRole.OWNER, TeamRole.ADMIN]
    )

    update_data = project_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    session.add(project)
    session.commit()
    session.refresh(project)
    return ProjectOut.model_validate(project)


@router.delete("/{project_id}", response_model=Message)
def delete_project(
    *, session: SessionDep, current_user: CurrentUser, project_id: str
) -> Any:
    """Delete a project."""
    project = get_project(session, project_id)
    # Check if user has admin permissions in the team
    check_team_permissions(
        session, project.team_id, current_user.id, [TeamRole.OWNER, TeamRole.ADMIN]
    )

    session.delete(project)
    session.commit()
    return Message(message="Project deleted successfully")

from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.api.routes.teams import check_team_permissions
from app.core.config import settings
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
    projects_out = [
        ProjectOut(
            id=p.id,
            team_id=p.team_id,
            title=p.title,
            description=p.description,
            model=p.model,
            instructions=p.instructions,
            files=p.files,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        for p in projects
    ]
    return ProjectsOut(data=projects_out, count=count)


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

    return ProjectOut.model_validate(project.model_dump())


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


@router.get("/{project_id}/prompt", response_model=Message)
def get_project_prompt(
    *, session: SessionDep, current_user: CurrentUser, project_id: str
) -> Any:
    """Get project prompt with file contents."""
    project = get_project(session, project_id)
    # Check if user has access to this project's team
    check_team_permissions(session, project.team_id, current_user.id)

    all_content = []

    # Add any files content if they exist
    if project.files:
        for file_path in project.files:
            full_path = Path(settings.UPLOAD_DIR) / file_path
            try:
                if full_path.exists():
                    with open(full_path, encoding="utf-8") as f:
                        content = f.read()
                        all_content.append(f"### File: {file_path}\n{content}\n")
            except Exception as e:
                print(f"Error reading file {file_path}: {str(e)}")
                continue

    # Combine project prompt with file contents
    file_contents = "\n".join(all_content)
    full_prompt = (
        f"{SYSTEM_PROMPT}\nAPI Collection Files:\n{file_contents}"
        if all_content
        else SYSTEM_PROMPT
    )

    return Message(message=full_prompt)


SYSTEM_PROMPT = """
You are an API Collection Assistant that helps users explore and test their APIs. Your core responsibilities are:

1. DOCUMENTATION & EXPLORATION
- Parse API collections (OpenAPI/Swagger, Postman)
- Explain endpoints concisely with parameters and examples
- Return all responses in formatted JSON

2. TESTING & VALIDATION
When asked to test an endpoint/API:
- Generate comprehensive test cases covering:
  * Happy path scenarios
  * Edge cases
  * Error scenarios
  * Security cases
  * Performance checks
- Execute test suite systematically
- Always present results in a clear table format:
```
| Test Case              | Status | Response Time | Notes          |
|-----------------------|--------|---------------|----------------|
| Valid input           | ✅     | 123ms        | 200 OK        |
| Missing auth          | ✅     | 89ms         | 401 as expected|
| Invalid parameter     | ❌     | 95ms         | Wrong error    |
```

3. REQUEST EXECUTION
{
  "request": {
    "method": "string",
    "endpoint": "string",
    "params": {}
  },
  "response": {
    "status": "number",
    "time": "string",
    "data": {}
  }
}

4. ERROR HANDLING
- Provide clear error messages with solutions
- Suggest fixes for common issues
- Maintain security best practices

Remember:
- Always generate test cases before executing tests
- Present results in tabular format for readability
- Keep responses concise but complete
- Prioritize security in suggestions
"""

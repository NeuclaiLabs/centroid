from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.api.routes.teams import check_team_permissions
from app.core.config import settings
from app.models import (
    Message,
    Project,
    ProjectOut,
    ProjectsOut,
    Team,
    TeamRole,
)

router = APIRouter()


def get_project(session: SessionDep, project_id: str) -> Project:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/", response_model=ProjectOut)
async def create_project(
    *,
    session: SessionDep,
    title: str = Form(...),
    description: str | None = Form(None),
    model: str = Form(...),
    instructions: str | None = Form(None),
    files: list[UploadFile] = File(None),
) -> Any:
    """Create new project with optional file uploads."""
    try:
        # Get team_id
        team_id = session.exec(select(Team.id)).one()

        # Create project first without files
        project_data = {
            "title": title,
            "description": description,
            "model": model,
            "instructions": instructions,
            "team_id": team_id,
            "files": [],  # Initialize empty files list
        }

        # Create and save project to get project_id
        project = Project.model_validate(project_data)
        session.add(project)
        session.commit()
        session.refresh(project)

        # Handle file uploads if present by delegating to the files endpoint
        if files:
            from app.api.routes.files import upload_files

            # Call the upload_files function directly
            upload_response = await upload_files(
                project_id=str(project.id), files=files
            )

            # Update project with the uploaded file paths
            project.files = upload_response.files
            session.add(project)
            session.commit()
            session.refresh(project)

        return ProjectOut.model_validate(project.model_dump())

    except Exception as e:
        # No need for manual cleanup as it's handled by the files endpoint
        raise HTTPException(
            status_code=500, detail=f"Failed to create project: {str(e)}"
        )


@router.get("/", response_model=ProjectsOut)
def read_projects(
    session: SessionDep,
    team_id: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Retrieve projects."""

    # Check team permissions first
    # check_team_permissions(session, team_id, current_user.id)
    team_id = session.exec(select(Team.id)).one()
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
async def update_project(
    *,
    session: SessionDep,
    project_id: str,
    title: str = Form(...),
    description: str | None = Form(None),
    model: str = Form(...),
    instructions: str | None = Form(None),
    files: str = Form(None),
    new_files: list[UploadFile] = File(None),
) -> Any:
    """Update a project."""
    project = get_project(session, project_id)

    # Create update data dictionary from form fields
    update_data = {
        "title": title,
        "description": description,
        "model": model,
        "instructions": instructions,
    }
    current_files = project.files or []
    files_list = files.split(",") if files and files.strip() else []
    project.files = [f for f in current_files if f in files_list]

    # Handle new file uploads
    if new_files:
        from app.api.routes.files import upload_files

        upload_response = await upload_files(
            project_id=str(project.id), files=new_files
        )
        current_files = project.files or []
        project.files = current_files + upload_response.files

    # Update other fields
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
You are an API Assistant designed to help users plan and execute API requests effectively. Follow these guidelines when processing requests:

# Request Analysis
- Parse user requests to identify:
  - Core intent and desired outcome
  - Required API endpoints
  - Necessary parameters and data
  - Dependencies between calls
  - Authentication requirements
- If any aspect is unclear, ask focused clarifying questions before proceeding
- Validate that all required information is available before creating a plan

# Plan Generation
When creating API execution plans:
- Break down complex operations into clear, sequential steps
- Include specific details for each API call:
  - HTTP method and full endpoint path
  - Required headers and authentication
  - Query parameters and their formats
  - Request body structure with example values
  - Expected response format
- Define error handling and retry strategies:
  - Retry counts and backoff periods
  - Timeout configurations
  - Error response handling
- Specify any data transformations between calls
- Include validation steps for critical data

# Plan Presentation
Present all API plans using the <apiPlan> custom tag with the following structure:
```xml
<apiPlan>
  <summary>Brief overview of what the plan will accomplish</summary>
  <steps>
    <step number="1">
      <action>API call details</action>
      <endpoint>Full endpoint URL</endpoint>
      <method>HTTP method</method>
      <headers>Required headers</headers>
      <body>Request body if applicable</body>
      <response>Expected response format</response>
    </step>
    <!-- Additional steps as needed -->
  </steps>
  <errorHandling>
    <retries>Number of retries</retries>
    <backoff>Backoff strategy</backoff>
    <timeout>Timeout configuration</timeout>
  </errorHandling>
</apiPlan>
```

# Interaction Guidelines
- Always wait for user confirmation before suggesting execution
- Provide clear explanations for each step's purpose
- Be receptive to user modifications and suggestions
- Highlight any potential risks or considerations
- Maintain context across multiple interactions
- Offer alternative approaches when applicable

# Examples
Here are some example interactions:

User: "I need to create a new user and then add them to a group"
"""

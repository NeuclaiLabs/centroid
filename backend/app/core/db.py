import json
import logging
from collections.abc import Sequence
from pathlib import Path

from sqlalchemy import func
from sqlmodel import Session, create_engine, select

from app import crud
from app.core.config import settings
from app.models import (
    ProjectCreate,
    TeamCreate,
    ToolDefinition,
    ToolDefinitionCreate,
    User,
    UserCreate,
)

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
logger = logging.getLogger(__name__)


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/tiangolo/full-stack-fastapi-template/issues/28


def get_tool_files() -> list[Path]:
    """Get the list of tool definition files to load."""
    base_path = Path(__file__).parent.parent / "mcp" / "openapi"
    return [base_path / "github" / "tools.json", base_path / "misc" / "tools.json"]


def load_tools_from_file(file_path: Path) -> list[dict]:
    """Load and validate tool definitions from a JSON file."""
    if file_path.exists():
        with open(file_path) as f:
            return json.load(f)
    return []


def populate_tool_definitions(session: Session, tool_files: Sequence[Path]) -> None:
    """
    Populate tool definitions from JSON files.
    This ensures all tool definitions are available and up-to-date on startup.

    Args:
        session: SQLModel session for database operations
        tool_files: Sequence of paths to tool definition JSON files
    """
    total_tools = 0
    new_tools = 0

    for tool_file in tool_files:
        tools_data = load_tools_from_file(tool_file)
        total_tools += len(tools_data)

        for tool in tools_data:
            # Get the tool name from schema
            tool_name = tool["tool_schema"]["name"]
            app_id = tool["app_id"]

            # Check if tool definition already exists by app_id and name using SQLite JSON functions
            existing_tool = session.exec(
                select(ToolDefinition)
                .where(ToolDefinition.app_id == app_id)
                .where(
                    func.json_extract(ToolDefinition.tool_schema, "$.name") == tool_name
                )
            ).first()

            if not existing_tool:
                logger.info(f"Adding new tool: {app_id}/{tool_name}")
                tool_in = ToolDefinitionCreate(
                    app_id=tool["app_id"],
                    tool_schema=tool["tool_schema"],
                    tool_metadata=tool["tool_metadata"],
                )
                crud.create_tool_definition(session=session, tool_definition=tool_in)
                new_tools += 1

    logger.info(
        f"Tool population complete. Total tools: {total_tools}, New tools added: {new_tools}"
    )


async def init_db(session: Session) -> None:
    """Initialize the database with required data."""
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # from sqlmodel import SQLModel

    # from app.core.engine import engine
    # This works because the models are already imported and registered from app.models
    # SQLModel.metadata.create_all(engine)

    # Create the database if it doesn't exist
    with Session(engine) as session:
        user = session.exec(
            select(User).where(User.email == settings.FIRST_SUPERUSER)
        ).first()
        if not user:
            user_in = UserCreate(
                email=settings.FIRST_SUPERUSER,
                password=settings.FIRST_SUPERUSER_PASSWORD,
                is_superuser=True,
            )
            user = crud.create_user(session=session, user_create=user_in)
            team_in = TeamCreate(
                name="Default",
                description="Default team",
            )
            team = crud.create_team(  # noqa: F841
                session=session, team_create=team_in, owner_id=user.id
            )

            # Create default project
            project_in = ProjectCreate(
                title="Sample Project",
                description="This is a sample project with OpenAstra backend API collection.",
                model=settings.LLM_DEFAULT_MODEL,
                instructions="""For baseUrl, use host as localhost and port as 8000.
                 Health endpoint is hosted at GET /api/v1/utils/health.""",
                team_id=team.id,
            )
            crud.create_project(session=session, project_create=project_in)

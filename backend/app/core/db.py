import glob
import json
import os
from pathlib import Path

from sqlmodel import Session, create_engine, select

from app import crud
from app.core.config import settings
from app.core.logger import get_logger
from app.models import (
    ProjectCreate,
    TeamCreate,
    User,
    UserCreate,
)
from app.models.mcp import MCPTemplate, MCPTemplateCreate, MCPTemplateUpdate

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
logger = get_logger(__name__)


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/tiangolo/full-stack-fastapi-template/issues/28


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
                description="This is a sample project with Centroid backend API collection.",
                model=settings.LLM_DEFAULT_MODEL,
                instructions="""For baseUrl, use host as localhost and port as 8000.
                 Health endpoint is hosted at GET /api/v1/utils/health.""",
                team_id=team.id,
            )
            crud.create_project(session=session, project_create=project_in)

        # Process MCP templates from JSON files
        try:
            # Path to the templates directory
            templates_dir = Path(__file__).parent.parent / "data" / "mcp_templates"
            template_files = glob.glob(os.path.join(templates_dir, "*.json"))

            logger.info(
                f"Found {len(template_files)} template files in {templates_dir}"
            )

            for file_path in template_files:
                try:
                    with open(file_path) as f:
                        template_data = json.load(f)

                    template_id = template_data["id"]

                    # Check if template exists
                    existing_template = session.exec(
                        select(MCPTemplate).where(MCPTemplate.id == template_id)
                    ).first()

                    if existing_template:
                        # Update existing template
                        update_data = MCPTemplateUpdate(**template_data)
                        update_dict = update_data.model_dump(exclude_unset=True)

                        for key, value in update_dict.items():
                            setattr(existing_template, key, value)

                        logger.info(f"Updated template: {template_id}")
                    else:
                        # Create new template
                        template = MCPTemplateCreate(**template_data)
                        db_template = MCPTemplate(**template.model_dump())
                        session.add(db_template)
                        logger.info(f"Added new template: {template_id}")

                except Exception as e:
                    logger.error(f"Error processing template {file_path}: {e}")

            session.commit()
            logger.info("MCP templates processed successfully")
        except Exception as e:
            logger.error(f"Failed to process MCP templates: {e}")

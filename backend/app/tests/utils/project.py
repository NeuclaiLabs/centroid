import random
import string

from sqlmodel import Session

from app.models import Project


def create_random_project(db: Session, team_id: str) -> Project:
    random_suffix = "".join(random.choices(string.ascii_lowercase, k=6))
    project = Project(
        title=f"Test Project {random_suffix}",
        description=f"Test description {random_suffix}",
        model="gpt-4",
        team_id=team_id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

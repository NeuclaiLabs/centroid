from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.core.config import settings
from app.models import TeamRole
from app.tests.utils.project import create_random_project
from app.tests.utils.team import add_team_member, create_random_team


def test_create_project(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
):
    team = create_random_team(db)
    add_team_member(
        db,
        team,
        crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER),
        TeamRole.ADMIN,
    )  # Add user as admin to the team

    data = {
        "title": "Test Project",
        "description": "A test project",
        "model": "gpt-4",
        "team_id": team.id,
    }
    response = client.post(
        f"{settings.API_V1_STR}/projects/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == data["title"]
    assert content["description"] == data["description"]
    assert content["model"] == data["model"]
    assert "id" in content


def test_read_projects(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
):
    team = create_random_team(db)
    project = create_random_project(db, team_id=team.id)
    add_team_member(
        db,
        team,
        crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER),
        TeamRole.ADMIN,
    )  # Add user as admin to the team

    response = client.get(
        f"{settings.API_V1_STR}/projects/",
        headers=normal_user_token_headers,
        params={"team_id": team.id},
    )
    assert response.status_code == 200
    content = response.json()
    # Add assertions for project title and description
    assert content["data"][0]["title"] == project.title
    assert content["data"][0]["description"] == project.description


def test_read_project(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
):
    team = create_random_team(db)
    project = create_random_project(db, team_id=team.id)
    add_team_member(
        db,
        team,
        crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER),
        TeamRole.ADMIN,
    )  # Add user as admin to the team

    response = client.get(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == project.id
    assert content["title"] == project.title


def test_update_project(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
):
    team = create_random_team(db)
    project = create_random_project(db, team_id=team.id)
    add_team_member(
        db,
        team,
        crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER),
        TeamRole.ADMIN,
    )  # Add user as admin to the team

    data = {
        "title": "Updated Project Title",
        "description": "Updated description",
        "model": "gpt-3.5-turbo",
    }
    response = client.put(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == data["title"]
    assert content["description"] == data["description"]
    assert content["model"] == data["model"]


def test_delete_project(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
):
    team = create_random_team(db)
    project = create_random_project(db, team_id=team.id)
    add_team_member(
        db,
        team,
        crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER),
        TeamRole.ADMIN,
    )  # Add user as admin to the team

    response = client.delete(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Project deleted successfully"


# Permission tests
def test_create_project_unauthorized(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
):
    team = create_random_team(db)
    add_team_member(
        db,
        team,
        crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER),
        TeamRole.MEMBER,
    )  # Add user as admin to the team

    data = {
        "title": "Test Project",
        "description": "A test project",
        "model": "gpt-4",
        "team_id": team.id,
    }
    response = client.post(
        f"{settings.API_V1_STR}/projects/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_update_project_unauthorized(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
):
    team = create_random_team(db)
    project = create_random_project(db, team_id=team.id)
    add_team_member(
        db,
        team,
        crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER),
        TeamRole.MEMBER,
    )  # Add user as admin to the team

    data = {"title": "Updated Project Title"}
    response = client.put(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_delete_project_unauthorized(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
):
    team = create_random_team(db)
    project = create_random_project(db, team_id=team.id)
    add_team_member(
        db,
        team,
        crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER),
        TeamRole.MEMBER,
    )  # Add user as admin to the team  # Regular member, not admin

    response = client.delete(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_read_project_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str]
):
    response = client.get(
        f"{settings.API_V1_STR}/projects/nonexistent-id",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404

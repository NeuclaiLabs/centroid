from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.core.config import settings
from app.models import TeamInvitationStatus, TeamRole
from app.tests.utils.team import create_random_team
from app.tests.utils.user import create_random_user


def test_create_team(client: TestClient, superuser_token_headers: dict[str, str]):
    data = {"name": "Test Team", "description": "A test team"}
    response = client.post(
        f"{settings.API_V1_STR}/teams/", headers=superuser_token_headers, json=data
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["description"] == data["description"]
    assert "id" in content


def test_read_teams(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
):
    create_random_team(
        db, crud.get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)
    )
    response = client.get(
        f"{settings.API_V1_STR}/teams/", headers=normal_user_token_headers
    )
    assert response.status_code == 200
    content = response.json()
    assert "data" in content
    assert "count" in content
    assert len(content["data"]) > 0
    # assert len(data) == len(normal_user.teams)  # Use owned_teams instead of teams


def test_read_team(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
):
    team = create_random_team(db)
    response = client.get(
        f"{settings.API_V1_STR}/teams/{team.id}", headers=superuser_token_headers
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == team.id
    assert content["name"] == team.name


def test_update_team(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
):
    team = create_random_team(db)
    data = {"name": "Updated Team Name", "description": "Updated description"}
    response = client.put(
        f"{settings.API_V1_STR}/teams/{team.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["description"] == data["description"]


def test_delete_team(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
):
    team = create_random_team(db)
    response = client.delete(
        f"{settings.API_V1_STR}/teams/{team.id}", headers=superuser_token_headers
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Team deleted successfully"


def test_add_team_member(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
):
    team = create_random_team(db)
    user = create_random_user(db)
    data = {
        "email": user.email,
        "role": TeamRole.MEMBER.value,
        "team_id": team.id,
    }
    response = client.post(
        f"{settings.API_V1_STR}/teams/{team.id}/members",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["user_id"] == user.id
    assert content["team_id"] == team.id
    assert content["role"] == data["role"]


def test_update_team_member_role(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
):
    team = create_random_team(db)
    user = create_random_user(db)
    # First, add the user to the team as a member
    add_member_data = {
        "email": user.email,
        "role": TeamRole.MEMBER.value,
        "team_id": team.id,
    }
    response = client.post(
        f"{settings.API_V1_STR}/teams/{team.id}/members",
        headers=superuser_token_headers,
        json=add_member_data,
    )
    assert response.status_code == 200
    # Then, update the user's role to admin
    update_role_data = {
        "role": TeamRole.ADMIN.value,
    }
    response = client.put(
        f"{settings.API_V1_STR}/teams/{team.id}/members/{user.id}",
        headers=superuser_token_headers,
        json=update_role_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["role"] == update_role_data["role"]


def test_remove_team_member(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
):
    team = create_random_team(db)
    user = create_random_user(db)

    # First, add the user to the team
    add_member_data = {
        "email": user.email,
        "role": TeamRole.MEMBER.value,
        "team_id": team.id,
    }
    client.post(
        f"{settings.API_V1_STR}/teams/{team.id}/members",
        headers=superuser_token_headers,
        json=add_member_data,
    )

    response = client.delete(
        f"{settings.API_V1_STR}/teams/{team.id}/members/{user.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200

    # Check that the user was removed successfully
    response = client.get(
        f"{settings.API_V1_STR}/teams/{team.id}/members",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    members_content = response.json()
    assert "data" in members_content
    assert user.id not in [member["user_id"] for member in members_content["data"]]


def test_get_team_members(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
):
    team = create_random_team(db)
    response = client.get(
        f"{settings.API_V1_STR}/teams/{team.id}/members",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert "data" in content
    assert len(content["data"]) > 0


def test_respond_to_invitation(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
):
    team = create_random_team(db)
    user = create_random_user(db)

    # Add the user to the team with a pending invitation
    add_member_data = {
        "email": user.email,
        "role": TeamRole.MEMBER.value,
        "team_id": team.id,
        "invitation_status": TeamInvitationStatus.PENDING.value,
    }
    client.post(
        f"{settings.API_V1_STR}/teams/{team.id}/members",
        headers=superuser_token_headers,
        json=add_member_data,
    )

    # Respond to the invitation
    response_data = {
        "response": TeamInvitationStatus.ACCEPTED.value,
    }
    response = client.post(
        f"{settings.API_V1_STR}/teams/{team.id}/respond-invitation",
        headers=superuser_token_headers,
        json=response_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == f"Invitation {TeamInvitationStatus.ACCEPTED.value}"

    # Verify the invitation status has been updated
    response = client.get(
        f"{settings.API_V1_STR}/teams/{team.id}/members",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    members_content = response.json()
    assert "data" in members_content
    assert any(
        member["user_id"] == user.id
        and member["invitation_status"] == TeamInvitationStatus.ACCEPTED.value
        for member in members_content["data"]
    )

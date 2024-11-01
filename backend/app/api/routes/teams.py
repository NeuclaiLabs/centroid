from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    Team,
    TeamCreate,
    TeamInvitationStatus,
    TeamMember,
    TeamMemberCreate,
    TeamMemberOut,
    TeamMembersOut,
    TeamMemberUpdate,
    TeamOut,
    TeamRole,
    TeamsOut,
    TeamUpdate,
    User,
    UserOut,
)

router = APIRouter()

# Common methods


def get_team(session: SessionDep, team_id: str) -> Team:
    team = session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


def get_team_member(session: SessionDep, team_id: str, user_id: str) -> TeamMember:
    team_member = session.exec(
        select(TeamMember).where(
            TeamMember.team_id == team_id, TeamMember.user_id == user_id
        )
    ).first()
    if not team_member:
        raise HTTPException(status_code=404, detail="User is not a member of this team")
    return team_member


def check_team_permissions(
    session: SessionDep,
    team_id: str,
    user_id: str,
    required_roles: list[TeamRole] = (TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER),
):
    team_member = get_team_member(session, team_id, user_id)
    if team_member.role not in required_roles:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return team_member


# Team CRUD operations
@router.post("/", response_model=TeamOut)
def create_team(
    *, session: SessionDep, current_user: CurrentUser, team_in: TeamCreate
) -> Any:
    """Create new team."""
    team = Team.model_validate(team_in)
    session.add(team)
    session.flush()  # Flush to get the team ID

    # Create a TeamMember entry for the owner
    team_member = TeamMember(
        team_id=team.id,
        user_id=current_user.id,
        role=TeamRole.OWNER,
        invitation_status=TeamInvitationStatus.ACCEPTED,
    )
    session.add(team_member)

    session.commit()
    session.refresh(team)

    return TeamOut.model_validate(team)


@router.get("/", response_model=TeamsOut)
def read_teams(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """Retrieve teams."""
    statement = (
        select(Team)
        .join(TeamMember, Team.id == TeamMember.team_id)
        .where(TeamMember.user_id == current_user.id)
        .distinct()
    )

    count = session.exec(select(func.count()).select_from(statement.subquery())).one()
    teams = session.exec(statement.offset(skip).limit(limit)).all()
    return TeamsOut(data=teams, count=count)


@router.get("/{id}", response_model=TeamOut)
def read_team(session: SessionDep, current_user: CurrentUser, id: str) -> Any:
    """Get team by ID."""
    team = get_team(session, id)
    check_team_permissions(session, id, current_user.id)
    return team


@router.put("/{team_id}", response_model=TeamOut)
def update_team(
    *, session: SessionDep, current_user: CurrentUser, team_id: str, team_in: TeamUpdate
) -> Any:
    """Update a team."""
    team = get_team(session, team_id)
    check_team_permissions(
        session, team_id, current_user.id, [TeamRole.OWNER, TeamRole.ADMIN]
    )

    update_data = team_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(team, field, value)

    session.add(team)
    session.commit()
    session.refresh(team)
    return TeamOut.model_validate(team)


@router.delete("/{team_id}", response_model=Message)
def delete_team(*, session: SessionDep, current_user: CurrentUser, team_id: str) -> Any:
    """Delete a team."""
    team = get_team(session, team_id)
    check_team_permissions(session, team_id, current_user.id, [TeamRole.OWNER])

    session.delete(team)
    session.commit()
    return Message(message="Team deleted successfully")


# Team member management
@router.post("/{team_id}/members", response_model=TeamMemberOut)
def add_team_member(
    *,
    team_id: str,
    session: SessionDep,
    current_user: CurrentUser,
    team_member_create: TeamMemberCreate,
) -> Any:
    """Add a new member to the team."""
    team_member_create = TeamMemberCreate.model_validate(team_member_create)
    team_member = TeamMember.model_validate(
        {
            **team_member_create.model_dump(),
            "team_id": team_id,
        }
    )

    if not team_member.email:
        raise HTTPException(status_code=400, detail="Email is required")
    check_team_permissions(
        session, team_member.team_id, current_user.id, [TeamRole.OWNER, TeamRole.ADMIN]
    )

    # Check if the user is already a member of the team
    existing_member = session.exec(
        select(TeamMember).where(
            TeamMember.team_id == team_member.team_id,
            TeamMember.email == team_member.email,
        )
    ).first()
    if existing_member:
        raise HTTPException(
            status_code=400, detail="User is already a member of this team"
        )

    # Check if the user exists in the system
    user = session.exec(select(User).where(User.email == team_member.email)).first()
    # Create a new TeamMember entry
    new_member = TeamMember(
        team_id=team_id,
        user_id=user.id if user else None,
        email=team_member.email,
        role=team_member.role,
        invitation_status=TeamInvitationStatus.ACCEPTED
        if user
        else TeamInvitationStatus.PENDING,
    )
    session.add(new_member)
    session.commit()

    # Send invitation email
    # invitation_link = f"{settings.server_host}/teams/{team_member.team_id}/accept-invitation"
    # send_email(
    #     email_to=team_member.email,
    #     subject=f"Invitation to join {team.name}",
    #     html_content=f"You have been invited to join the team {team.name}. Click here to accept: {invitation_link}",
    # )
    return TeamMemberOut.model_validate(new_member)


@router.put("/{team_id}/members/{user_id}", response_model=TeamMemberOut)
def update_team_member(
    *,
    team_id: str,
    user_id: str,
    session: SessionDep,
    current_user: CurrentUser,
    team_member_update: TeamMemberUpdate,
) -> Any:
    """Update a team member's role."""
    team_member_update = TeamMemberUpdate.model_validate(team_member_update)

    check_team_permissions(
        session, team_id, current_user.id, [TeamRole.OWNER, TeamRole.ADMIN]
    )

    team_member = get_team_member(session, team_id, user_id)

    # Prevent changing the role of the team owner
    if team_member.role == TeamRole.OWNER:
        raise HTTPException(
            status_code=403, detail="Cannot change the role of the team owner"
        )

    # Update the team member's attributes directly
    update_data = team_member_update.model_dump(
        exclude_unset=True, exclude_defaults=True
    )
    team_member.sqlmodel_update(update_data)

    session.add(team_member)
    session.commit()
    session.refresh(team_member)
    return TeamMemberOut.model_validate(team_member)


@router.delete("/{team_id}/members/{user_id}")
def remove_team_member(
    team_id: str,
    user_id: str,
    current_user: CurrentUser,
    session: SessionDep,
) -> TeamOut:
    team = get_team(session, team_id)
    check_team_permissions(
        session, team_id, current_user.id, [TeamRole.OWNER, TeamRole.ADMIN]
    )

    team_member = get_team_member(session, team_id, user_id)
    session.delete(team_member)
    session.commit()
    session.refresh(team)

    return TeamOut.model_validate(team)


@router.get("/{team_id}/members", response_model=TeamMembersOut)
def get_team_members(
    team_id: str,
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> TeamMembersOut:
    check_team_permissions(session, team_id, current_user.id)

    # Retrieve all members of the team, including pending invitations
    statement = (
        select(TeamMember, User)
        .outerjoin(User, TeamMember.user_id == User.id)  # Changed to outer join
        .where(TeamMember.team_id == team_id)  # Removed invitation status filter
    )

    count = session.exec(select(func.count()).select_from(statement.subquery())).one()
    team_members = session.exec(statement.offset(skip).limit(limit)).all()

    # Convert TeamMember objects to TeamMemberOut, handling cases without associated users
    team_members_out = [
        TeamMemberOut(
            team_id=member.TeamMember.team_id,
            user_id=member.TeamMember.user_id,
            email=member.TeamMember.email,
            role=member.TeamMember.role,
            invitation_status=member.TeamMember.invitation_status,
            name=member.User.full_name if member.User else None,  # Handle None case
            user=UserOut.model_validate(member.User)
            if member.User
            else None,  # Handle None case
        )
        for member in team_members
    ]

    return TeamMembersOut(data=team_members_out, count=count)


@router.post("/{team_id}/respond-invitation")
def respond_to_invitation(
    team_id: str,
    response: TeamInvitationStatus,
    current_user: CurrentUser,
    session: SessionDep,
) -> Message:
    team_member = session.exec(
        select(TeamMember).where(
            TeamMember.team_id == team_id, TeamMember.email == current_user.email
        )
    ).first()
    if not team_member or team_member.invitation_status != TeamInvitationStatus.PENDING:
        raise HTTPException(status_code=404, detail="No pending invitation found")

    team_member.invitation_status = response
    if response == TeamInvitationStatus.ACCEPTED:
        team_member.user_id = current_user.id
    session.add(team_member)
    session.commit()

    return Message(message=f"Invitation {response.value}")

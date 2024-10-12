from sqlmodel import Session

from app.models import (
    Team,
    TeamCreate,
    TeamInvitationStatus,
    TeamMember,
    TeamRole,
    User,
)
from app.tests.utils.user import get_super_user
from app.tests.utils.utils import random_lower_string


def create_random_team(db: Session, user: User | None = None) -> Team:
    if user is None:
        user = get_super_user(db)
    owner_id = user.id
    name = random_lower_string()
    description = random_lower_string()
    team_in = TeamCreate(name=name, description=description)
    team = Team.model_validate(team_in)
    db.add(team)
    db.commit()
    db.refresh(team)

    # Adding owner_id to TeamMember
    team_member = TeamMember(
        team_id=team.id,
        user_id=owner_id,
        role=TeamRole.OWNER,
        invitation_status=TeamInvitationStatus.ACCEPTED,
    )
    db.add(team_member)
    db.commit()
    db.refresh(team_member)

    return team

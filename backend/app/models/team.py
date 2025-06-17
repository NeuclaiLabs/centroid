from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional

import nanoid
from sqlalchemy import UniqueConstraint
from sqlmodel import DateTime, Field, Relationship, SQLModel, func

from .user import UserOut

if TYPE_CHECKING:
    from .project import Project
    from .team_member import TeamMember
    from .user import User


class TeamRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class TeamInvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class TeamBase(SQLModel):
    name: str = Field(index=True)
    description: str | None = None


class TeamCreate(TeamBase):
    pass


class TeamUpdate(TeamBase):
    description: str | None = None
    name: str | None = None


class Team(TeamBase, table=True):
    __tablename__ = "teams"

    id: str = Field(default_factory=nanoid.generate, primary_key=True)
    members: list["TeamMember"] = Relationship(
        back_populates="team", cascade_delete=True
    )
    projects: list["Project"] = Relationship(back_populates="team", cascade_delete=True)
    created_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now()},
        index=True,
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()},
        index=True,
    )


class TeamMemberBase(SQLModel):
    email: str | None = Field(default=None, index=True)
    role: TeamRole = Field(default=TeamRole.MEMBER, index=True)
    invitation_status: TeamInvitationStatus = Field(
        default=TeamInvitationStatus.PENDING, index=True
    )


class TeamMember(TeamMemberBase, table=True):
    __tablename__ = "team_members"
    __table_args__ = (UniqueConstraint("team_id", "email", name="uq_team_email"),)

    team_id: str = Field(
        foreign_key="teams.id", ondelete="CASCADE", primary_key=True, index=True
    )
    user_id: str | None = Field(
        default=None,
        foreign_key="users.id",
        ondelete="CASCADE",
        primary_key=True,
        index=True,
    )
    team: Team = Relationship(back_populates="members")
    user: Optional["User"] = Relationship(back_populates="team_memberships")


class TeamMemberCreate(SQLModel):
    email: str | None = None
    user_id: str | None = None
    role: TeamRole = Field(default=TeamRole.MEMBER)


class TeamMemberUpdate(SQLModel):
    role: TeamRole | None = None
    invitation_status: TeamInvitationStatus | None = None


class TeamMemberOut(SQLModel):
    user_id: str | None = None
    team_id: str
    email: str | None = None
    role: TeamRole
    invitation_status: TeamInvitationStatus
    user: UserOut | None = None


class TeamMembersOut(SQLModel):
    data: list[TeamMemberOut]
    count: int


class TeamOut(TeamBase):
    id: str


class TeamsOut(SQLModel):
    data: list[TeamOut]
    count: int


class TeamOutWithMembers(TeamOut):
    members: list[TeamMemberOut] = []

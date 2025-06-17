from datetime import datetime
from typing import TYPE_CHECKING

import nanoid
from sqlalchemy import DateTime, UniqueConstraint, func
from sqlmodel import Field, Relationship, SQLModel

from .base import CamelModel
from .user import User

if TYPE_CHECKING:
    from .chat import Chat
    from .message import Message


class VoteBase(CamelModel):
    chat_id: str
    message_id: str
    is_upvoted: bool = Field(index=True)


class VoteCreate(VoteBase):
    pass


class VoteUpdate(VoteBase):
    is_upvoted: bool | None = None


class Vote(VoteBase, SQLModel, table=True):
    __tablename__ = "votes"
    __table_args__ = (
        UniqueConstraint("user_id", "message_id", name="uq_user_message_vote"),
    )

    id: str = Field(primary_key=True, default_factory=nanoid.generate)
    user_id: str = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    chat_id: str = Field(foreign_key="chats.id", ondelete="CASCADE", index=True)
    message_id: str = Field(foreign_key="messages.id", ondelete="CASCADE", index=True)
    created_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now()},
        index=True,
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": func.now(), "server_default": func.now()},
        index=True,
    )

    # Relationships
    user: User = Relationship(back_populates="votes")
    chat: "Chat" = Relationship(back_populates="votes")
    message: "Message" = Relationship(back_populates="votes")


class VoteOut(VoteBase):
    id: str
    user_id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class VotesOut(CamelModel):
    data: list[VoteOut]
    count: int

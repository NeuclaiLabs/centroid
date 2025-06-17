from datetime import datetime
from typing import TYPE_CHECKING

import nanoid
from sqlalchemy import DateTime, func
from sqlmodel import JSON, Column, Field, Relationship, SQLModel

from .base import CamelModel

if TYPE_CHECKING:
    from .chat import Chat
    from .vote import Vote


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: str = Field(primary_key=True, default_factory=nanoid.generate)
    chat_id: str = Field(foreign_key="chats.id", ondelete="CASCADE", index=True)
    role: str = Field(index=True)
    parts: list | str | dict | None = Field(sa_column=Column(JSON))
    attachments: list | dict | None = Field(default=None, sa_column=Column(JSON))
    created_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now()},
        index=True,
    )
    chat: "Chat" = Relationship(back_populates="messages")
    votes: list["Vote"] = Relationship(back_populates="message", cascade_delete=True)


class MessageCreate(CamelModel):
    id: str = Field(default_factory=nanoid.generate)
    chat_id: str
    role: str
    parts: list | str | dict | None
    attachments: list | dict | None = None


class MessageOut(CamelModel):
    id: str
    chat_id: str
    role: str
    parts: list | str | dict | None
    attachments: list | dict | None = None
    created_at: datetime | None = None


class MessagesOut(CamelModel):
    data: list[MessageOut]
    count: int

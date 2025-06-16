from datetime import datetime

from sqlalchemy import Column, ForeignKey
from sqlmodel import Field, Relationship, SQLModel

from .chat import Chat


class StreamBase(SQLModel):
    chat_id: str


# Properties to receive on stream creation
class StreamCreate(StreamBase):
    id: str | None = None  # Allow frontend to provide ID or auto-generate
    chat_id: str


# Properties to receive on stream update
class StreamUpdate(SQLModel):
    chat_id: str | None = None


# Database model, database table inferred from class name
class Stream(StreamBase, table=True):
    __tablename__ = "streams"

    id: str = Field(primary_key=True)
    chat_id: str = Field(sa_column=Column(ForeignKey("chats.id", ondelete="CASCADE")))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    chat: Chat | None = Relationship(back_populates="streams")


# Properties to return via API, id is always required
class StreamOut(StreamBase):
    id: str
    chat_id: str
    created_at: datetime


class StreamsOut(SQLModel):
    data: list[StreamOut]
    count: int

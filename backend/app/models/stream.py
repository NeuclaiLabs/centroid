from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel

from .base import CamelModel
from .chat import Chat


# Base class for API models with camelCase conversion
class StreamBase(CamelModel):
    chat_id: str


# Properties to receive on stream creation
class StreamCreate(StreamBase):
    id: str | None = None  # Allow frontend to provide ID or auto-generate
    chat_id: str


# Properties to receive on stream update
class StreamUpdate(CamelModel):
    chat_id: str | None = None


# Database model, database table inferred from class name
class Stream(SQLModel, table=True):
    __tablename__ = "streams"

    id: str = Field(primary_key=True)
    chat_id: str = Field(foreign_key="chats.id", ondelete="CASCADE", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    # Relationships
    chat: Chat | None = Relationship(back_populates="streams")


# Properties to return via API, id is always required
class StreamOut(StreamBase):
    id: str
    chat_id: str
    created_at: datetime


class StreamsOut(CamelModel):
    data: list[StreamOut]
    count: int

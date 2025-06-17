from datetime import datetime

import nanoid
from sqlalchemy import DateTime, ForeignKeyConstraint, func
from sqlmodel import Field, Relationship, SQLModel

from .base import CamelModel
from .document import Document
from .user import User


class SuggestionBase(CamelModel):
    original_text: str
    suggested_text: str
    description: str | None = None
    is_resolved: bool = Field(default=False, index=True)


class SuggestionCreate(SuggestionBase):
    document_id: str


class SuggestionUpdate(CamelModel):
    suggested_text: str | None = None
    description: str | None = None
    is_resolved: bool | None = None


class Suggestion(SuggestionBase, SQLModel, table=True):
    __tablename__ = "suggestions"
    __table_args__ = (
        ForeignKeyConstraint(
            ["document_id", "document_created_at"],
            ["documents.id", "documents.created_at"],
            ondelete="CASCADE",
        ),
    )

    id: str = Field(primary_key=True, default_factory=nanoid.generate)
    user_id: str = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    document_id: str = Field(index=True)
    document_created_at: datetime = Field(
        sa_type=DateTime(timezone=True),
        index=True,
    )
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
    user: User = Relationship(back_populates="suggestions")
    document: Document = Relationship(back_populates="suggestions")


class SuggestionOut(SuggestionBase):
    id: str
    user_id: str
    document_id: str
    document_created_at: datetime
    created_at: datetime | None = None
    updated_at: datetime | None = None


class SuggestionsOut(CamelModel):
    data: list[SuggestionOut]
    count: int

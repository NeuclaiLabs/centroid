from datetime import datetime
from enum import Enum
from typing import ForwardRef

from sqlalchemy import DateTime, func
from sqlmodel import Field, Relationship, SQLModel

from .base import CamelModel
from .user import User


class DocumentKind(str, Enum):
    TEXT = "text"
    CODE = "code"
    IMAGE = "image"
    SHEET = "sheet"
    SDLC_TASK = "sdlc_task"
    DEVELOPER = "developer"
    PLANNER = "planner"
    ARCHITECT = "architect"
    TESTER = "tester"
    REVIEWER = "reviewer"
    DOCUMENTER = "documenter"


class DocumentBase(CamelModel):
    title: str = Field(index=True)
    content: str | None = None
    kind: DocumentKind = Field(default=DocumentKind.TEXT, index=True)


class DocumentCreate(DocumentBase):
    id: str | None = None
    project_id: str | None = None


class DocumentUpdate(CamelModel):
    title: str | None = None
    content: str | None = None
    kind: DocumentKind | None = None
    project_id: str | None = None


class Document(DocumentBase, SQLModel, table=True):
    __tablename__ = "documents"

    # Composite primary key: id + created_at for versioning
    id: str = Field(primary_key=True, index=True)
    created_at: datetime | None = Field(
        default=None,
        primary_key=True,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now()},
        index=True,
    )

    user_id: str = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    project_id: str | None = Field(
        default=None, foreign_key="projects.id", ondelete="CASCADE", index=True
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": func.now(), "server_default": func.now()},
        index=True,
    )

    # Relationships
    user: User = Relationship(back_populates="documents")
    project: "Project" = Relationship(back_populates="documents")  # noqa: F821
    suggestions: list[ForwardRef("Suggestion")] = Relationship(
        back_populates="document", cascade_delete=True
    )


class DocumentOut(DocumentBase):
    id: str
    user_id: str
    project_id: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class DocumentsOut(CamelModel):
    data: list[DocumentOut]
    count: int

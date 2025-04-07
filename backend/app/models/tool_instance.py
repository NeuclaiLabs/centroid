from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING, Any

import nanoid
from sqlalchemy import JSON, DateTime, event, func
from sqlmodel import Field, Relationship, SQLModel

from .base import CamelModel
from .tool_definition import ToolDefinition, ToolDefinitionOut

if TYPE_CHECKING:
    from .user import User


class ToolInstanceStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class ToolInstanceSearch(CamelModel):
    app_id: str | None = None


class ToolInstanceBase(CamelModel):
    definition_id: str = Field(foreign_key="tool_definitions.id")
    status: ToolInstanceStatus = Field(default=ToolInstanceStatus.ACTIVE)
    owner_id: str = Field(foreign_key="users.id")
    app_id: str = Field(foreign_key="apps.id")
    config: dict[str, Any] | None = Field(default=None, sa_type=JSON)


class ToolInstanceCreate(ToolInstanceBase):
    pass


class ToolInstanceUpdate(CamelModel):
    definition_id: str | None = None
    status: ToolInstanceStatus | None = None
    app_id: str | None = None
    config: dict[str, Any] | None = None


class ToolInstance(ToolInstanceBase, SQLModel, table=True):
    __tablename__ = "tool_instances"
    id: str | None = Field(default_factory=nanoid.generate, primary_key=True)
    app_id: str = Field(nullable=False)
    created_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={
            "server_default": func.now(),
        },
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": func.now(), "server_default": func.now()},
    )
    definition: ToolDefinition = Relationship(back_populates="tool_instances")
    owner: User = Relationship(back_populates="tool_instances")


# SQLAlchemy event listeners for handling tool registration
@event.listens_for(ToolInstance, "before_insert")
def handle_initial_registration(mapper, connection, target: ToolInstance) -> None:  # noqa: ARG001
    """Handle tool registration for newly created instances."""
    from app.services.tool_registration import ToolRegistrationService

    if target.status == ToolInstanceStatus.ACTIVE:
        ToolRegistrationService.sync_registration_state(
            target.status,
            None,
            target.definition.tool_schema,
            target.definition.tool_metadata,
            target.config,
        )


@event.listens_for(ToolInstance, "before_update")
def handle_status_change(mapper, connection, target: ToolInstance) -> None:  # noqa: ARG001
    """Handle tool registration/deregistration when status changes."""
    from app.services.tool_registration import ToolRegistrationService

    history = target._sa_instance_state.attrs.status.history
    if history.has_changes():
        old_status = history.deleted[0] if history.deleted else None
        ToolRegistrationService.sync_registration_state(
            target.status,
            old_status,
            target.definition.tool_schema,
            target.definition.tool_metadata,
            target.config,
        )


class ToolInstanceOut(ToolInstanceBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    definition: ToolDefinitionOut


class ToolInstancesOut(CamelModel):
    data: list[ToolInstanceOut]
    count: int

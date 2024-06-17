from datetime import datetime

import nanoid
from sqlalchemy import DateTime, func
from sqlmodel import JSON, Field, Relationship, SQLModel  # Shared properties

from .user import User


class SettingBase(SQLModel):
    data: dict


class SettingCreate(SettingBase):
    data: dict = {"general": {}, "code": {}, "search": {}}.copy()


class SettingUpdate(SettingBase):
    updated_at: datetime = datetime.utcnow()


class Setting(SettingBase, table=True):
    id: str = Field(default_factory=nanoid.generate, primary_key=True)
    data: dict | None = Field(default=None, sa_type=JSON)

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
    owner_id: str | None = Field(
        default=None, foreign_key="user.id", nullable=False, alias="ownerId"
    )
    owner: User | None = Relationship(back_populates="settings")


class SettingOut(SettingBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime


class SettingsOut(SQLModel):
    data: list[SettingOut]
    count: int

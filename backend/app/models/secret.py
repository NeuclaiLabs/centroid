from datetime import datetime
from typing import Any

import nanoid
from sqlalchemy import Column, DateTime, String, func
from sqlmodel import Field, Relationship, SQLModel

from app.core.logger import get_logger
from app.core.security import decrypt_dict, encrypt_dict

from .base import CamelModel
from .user import User

logger = get_logger(__name__, service="secrets")


class SecretBase(CamelModel, SQLModel):
    name: str
    description: str | None = None
    owner_id: str | None = Field(default=None, foreign_key="users.id")
    environment: str = Field(
        default="development"
    )  # e.g., development, staging, production


class SecretCreate(SecretBase):
    value: str


class SecretUpdate(CamelModel):
    name: str | None = None
    description: str | None = None
    value: str | None = None
    environment: str | None = None


class SecretSearch(CamelModel):
    environment: str | None = None


class Secret(SecretBase, SQLModel, table=True):
    __tablename__ = "secrets"
    id: str = Field(default_factory=nanoid.generate, primary_key=True)
    encrypted_value: str | None = Field(
        default=None, sa_column=Column("encrypted_value", String)
    )

    owner: User = Relationship(back_populates="secrets")

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

    def __init__(self, **data):
        value = data.pop("value", None)
        super().__init__(**data)
        if value is not None:
            self.value = value

    @property
    def value(self) -> str | None:
        """Decrypt and return the secret value."""
        if not self.encrypted_value:
            return None
        try:
            value_dict = decrypt_dict(self.encrypted_value)
            return value_dict.get("value")
        except Exception as e:
            logger.error(f"Error decrypting value: {e}")
            return None

    @value.setter
    def value(self, value: str | None) -> None:
        """Encrypt and store the secret value."""
        if value is None:
            self.encrypted_value = None
            return

        # Store the value in a dict to maintain consistency with encryption pattern
        value_dict = {"value": value}
        self.encrypted_value = encrypt_dict(value_dict)

    def model_dump(self, *args, **kwargs) -> dict[str, Any]:
        """Override model_dump to include value in the output."""
        exclude = kwargs.pop("exclude", set())
        data = super().model_dump(
            *args, exclude=exclude | {"encrypted_value"}, **kwargs
        )

        # Only include value if it's not excluded
        if "value" not in exclude:
            try:
                value = self.value
                data["value"] = value
            except Exception as e:
                logger.error(f"Error including value in model_dump: {e}")
                data["value"] = None

        return data


class SecretOut(CamelModel):
    id: str
    name: str
    description: str | None = None
    environment: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    # Note: value is intentionally excluded from the default output for security


class SecretWithValueOut(SecretOut):
    value: str | None = None


class SecretsOut(CamelModel):
    data: list[SecretOut]
    count: int

"""Model for secrets."""

from datetime import datetime
from typing import TYPE_CHECKING

import nanoid
from cryptography.fernet import Fernet
from sqlalchemy import Column, DateTime, String, func
from sqlmodel import Field, Relationship, SQLModel

from app.core.logger import get_logger
from app.core.security import get_encryption_key

from .base import CamelModel

if TYPE_CHECKING:
    from .user import User

logger = get_logger(__name__, service="secret")


def encrypt_string(data: str) -> str:
    """Encrypt a string."""
    if not data:
        return ""
    f = Fernet(get_encryption_key())
    return f.encrypt(data.encode()).decode()


def decrypt_string(encrypted_data: str) -> str:
    """Decrypt a string."""
    if not encrypted_data:
        return ""
    f = Fernet(get_encryption_key())
    return f.decrypt(encrypted_data.encode()).decode()


class SecretBase(CamelModel):
    """Base model for secrets."""

    name: str = Field(index=True, description="Name of the secret")
    description: str | None = Field(
        default=None, description="Description of the secret"
    )
    provider: str = Field(description="Provider/service for the secret")


class Secret(SecretBase, SQLModel, table=True):
    """Model for secrets."""

    __tablename__ = "secrets"

    id: str = Field(primary_key=True, default_factory=nanoid.generate)

    encrypted_value: str | None = Field(
        default=None,
        sa_column=Column("encrypted_value", String),
        description="Encrypted value of the secret",
    )
    created_at: datetime = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={
            "server_default": func.now(),
        },
        description="Timestamp when the secret was created",
    )
    updated_at: datetime = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": func.now(), "server_default": func.now()},
        description="Timestamp when the secret was last updated",
    )
    owner_id: str = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    owner: "User" = Relationship(back_populates="secrets")

    @property
    def value(self) -> str | None:
        """Decrypt and return the secret value."""
        if not self.encrypted_value:
            return None
        try:
            return decrypt_string(self.encrypted_value)
        except Exception as e:
            logger.critical(f"Error decrypting value for secret {self.id}: {e}")
            return None

    @value.setter
    def value(self, value: str | None) -> None:
        """Encrypt and store the secret value."""
        if value is None:
            self.encrypted_value = None
            return
        try:
            self.encrypted_value = encrypt_string(value)
        except Exception as e:
            logger.critical(f"Failed to encrypt value for secret {self.id}: {e}")
            raise


class SecretCreate(SecretBase):
    """Model for creating a secret."""

    id: str | None = Field(default=None, description="Optional ID for the secret")
    name: str | None = Field(default=None, description="Name of the secret")
    value: str = Field(description="Value of the secret")
    provider: str | None = Field(
        default=None, description="Provider/service for the secret"
    )


class SecretUpdate(CamelModel):
    """Model for updating a secret."""

    name: str | None = None
    description: str | None = None
    value: str | None = None
    provider: str | None = None


class SecretOut(SecretBase):
    """Model for secret output."""

    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    value: str | None = None


class SecretsOut(CamelModel):
    """Model for secrets output."""

    data: list[SecretOut]
    count: int

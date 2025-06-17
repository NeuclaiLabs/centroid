from datetime import datetime
from enum import Enum
from typing import Any, Literal

import nanoid
from sqlalchemy import Column, DateTime, String, func
from sqlmodel import Field, Relationship, SQLModel

from app.core.logger import get_logger
from app.core.security import decrypt_dict, encrypt_dict

from .base import CamelModel
from .user import User

logger = get_logger(__name__, service="secrets")


class AuthType(str, Enum):
    NONE = "none"
    TOKEN = "token"
    API_KEY = "api_key"
    BASIC = "basic"


class TokenAuth(CamelModel):
    token: str


class ApiKeyAuth(CamelModel):
    key: str
    value: str
    location: Literal["header", "query"]


class BasicAuth(CamelModel):
    username: str
    password: str


class AuthConfig(CamelModel):
    type: AuthType
    config: dict | TokenAuth | ApiKeyAuth | BasicAuth = {}


class SecretBase(CamelModel, SQLModel):
    name: str = Field(index=True)
    description: str | None = None
    owner_id: str | None = Field(
        default=None, foreign_key="users.id", ondelete="CASCADE", index=True
    )
    mcp_server_id: str | None = Field(
        default=None, foreign_key="mcp_servers.id", ondelete="CASCADE", index=True
    )
    environment: str = Field(
        default="development", index=True
    )  # e.g., development, staging, production
    kind: str = Field(default="ENV", index=True)  # e.g., ENV, API_KEY, etc.


class SecretCreate(SecretBase):
    value: dict[str, Any] | str | AuthConfig


class SecretUpdate(CamelModel):
    name: str | None = None
    description: str | None = None
    value: dict[str, Any] | str | AuthConfig | None = None
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
    # mcp_instance: MCPInstance | None = Relationship(back_populates="secrets")

    created_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={
            "server_default": func.now(),
        },
        index=True,
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": func.now(), "server_default": func.now()},
        index=True,
    )

    def __init__(self, **data):
        value = data.pop("value", None)
        super().__init__(**data)
        if value is not None:
            self.value = value

    @property
    def value(self) -> dict[str, Any] | str | AuthConfig | None:
        """Decrypt and return the secret value."""
        if not self.encrypted_value:
            return None
        try:
            decrypted = decrypt_dict(self.encrypted_value)
            # If the decrypted value is a dict with a single 'value' key, return its value
            if (
                isinstance(decrypted, dict)
                and len(decrypted) == 1
                and "value" in decrypted
            ):
                return decrypted["value"]
            # If it's an auth config, convert it
            if isinstance(decrypted, dict) and "type" in decrypted:
                return AuthConfig.model_validate(decrypted)
            return decrypted
        except Exception as e:
            logger.error(f"Error decrypting value: {e}")
            return None

    @value.setter
    def value(self, value: dict[str, Any] | str | AuthConfig | None) -> None:
        """Encrypt and store the secret value."""
        if value is None:
            self.encrypted_value = None
            return

        # If value is a string, wrap it in a dict to maintain consistency
        if isinstance(value, str):
            value = {"value": value}
        # If value is an AuthConfig, convert it to dict
        elif isinstance(value, AuthConfig):
            value = value.model_dump()

        self.encrypted_value = encrypt_dict(value)

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
    mcp_instance_id: str | None = None
    kind: str
    created_at: datetime
    updated_at: datetime
    # Note: value is intentionally excluded from the default output for security


class SecretWithValueOut(SecretOut):
    value: dict[str, Any] | str | AuthConfig | None = None


class SecretsOut(CamelModel):
    data: list[SecretOut]
    count: int

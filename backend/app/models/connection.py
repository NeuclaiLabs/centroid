from datetime import datetime
from enum import Enum
from typing import Literal

import nanoid
from sqlalchemy import Column, DateTime, String, func
from sqlmodel import Field, Relationship, SQLModel

from app.core.security import decrypt_dict, encrypt_dict

from .base import CamelModel


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


class ConnectionBase(CamelModel):
    name: str
    description: str | None = None
    kind: str
    base_url: str | None = None

    class Config:
        json_encoders = {AuthConfig: lambda v: v.model_dump() if v else None}


class ConnectionCreate(ConnectionBase):
    auth: AuthConfig | None = None


class ConnectionUpdate(CamelModel):
    name: str | None = None
    description: str | None = None
    kind: str | None = None
    base_url: str | None = None
    auth: AuthConfig | None = None


class Connection(ConnectionBase, SQLModel, table=True):
    __tablename__ = "connections"
    id: str = Field(default_factory=nanoid.generate, primary_key=True)
    encrypted_auth: str | None = Field(
        default=None, sa_column=Column("encrypted_auth", String)
    )

    tool_instances: list["ToolInstance"] = Relationship(back_populates="connection")

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
        auth = data.pop("auth", None)
        super().__init__(**data)
        if auth:
            self.auth = auth

    @property
    def auth(self) -> AuthConfig | None:
        """Decrypt and return the auth configuration."""
        if not self.encrypted_auth:
            return None
        auth_dict = decrypt_dict(self.encrypted_auth)
        return AuthConfig.model_validate(auth_dict)

    @auth.setter
    def auth(self, value: AuthConfig | dict | None) -> None:
        """Encrypt and store the auth configuration."""
        if value is None:
            self.encrypted_auth = None
        else:
            # Handle both AuthConfig and dict cases
            if isinstance(value, dict):
                # Convert dict to AuthConfig
                value = AuthConfig.model_validate(value)

            auth_dict = value.model_dump()
            self.encrypted_auth = encrypt_dict(auth_dict)

    def model_dump(self, *args, **kwargs):
        """Override model_dump to include auth in the output."""
        data = super().model_dump(*args, **kwargs)
        if "encrypted_auth" in data:
            del data["encrypted_auth"]
        data["auth"] = self.auth.model_dump() if self.auth else None
        return data


class ConnectionOut(CamelModel):
    id: str
    name: str
    description: str | None = None
    kind: str
    base_url: str | None = None
    auth: AuthConfig | None = None
    created_at: datetime
    updated_at: datetime


class ConnectionsOut(CamelModel):
    data: list[ConnectionOut]
    count: int


# Resolve forward references
from .tool_instance import ToolInstance  # noqa

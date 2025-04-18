from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Any, Literal

import nanoid
from sqlalchemy import Column, DateTime, String, func
from sqlmodel import Field, Relationship, SQLModel

from app.core.security import decrypt_dict, encrypt_dict

from .base import CamelModel
from .user import User

if TYPE_CHECKING:
    from .mcp_instance import MCPInstance


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


class ConnectionBase(CamelModel, SQLModel):
    name: str
    description: str | None = None
    provider_id: str
    base_url: str | None = Field(default=None)
    owner_id: str | None = Field(default=None, foreign_key="users.id")


class ConnectionSearch(CamelModel):
    provider_id: str | None = None


class ConnectionCreate(ConnectionBase):
    auth: AuthConfig | None = None


class ConnectionUpdate(CamelModel):
    name: str | None = None
    description: str | None = None
    base_url: str | None = Field(default=None)
    provider_id: str | None = Field(default=None)
    auth: AuthConfig | None = None


class Connection(ConnectionBase, SQLModel, table=True):
    __tablename__ = "connections"
    id: str = Field(default_factory=nanoid.generate, primary_key=True)
    encrypted_auth: str | None = Field(
        default=None, sa_column=Column("encrypted_auth", String)
    )

    owner: User = Relationship(back_populates="connections")
    mcp_instances: list["MCPInstance"] = Relationship(
        back_populates="connection",
    )

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
        try:
            auth_dict = decrypt_dict(self.encrypted_auth)
            return AuthConfig.model_validate(auth_dict)
        except Exception as e:
            print(f"Error decrypting auth: {e}")
            return None

    @auth.setter
    def auth(self, value: AuthConfig | dict | None) -> None:
        """Encrypt and store the auth configuration."""
        if value is None:
            self.encrypted_auth = None
            return

        # Handle both AuthConfig and dict cases
        if isinstance(value, dict):
            # Convert dict to AuthConfig
            value = AuthConfig.model_validate(value)

        # Handle AuthType.API_KEY enum serialization issue
        # Convert enum types to their string values for storage
        auth_dict = value.model_dump()
        if isinstance(auth_dict.get("type"), AuthType):
            auth_dict["type"] = auth_dict["type"].value

        self.encrypted_auth = encrypt_dict(auth_dict)

    def model_dump(self, *args, **kwargs) -> dict[str, Any]:
        """Override model_dump to include auth in the output."""
        exclude = kwargs.pop("exclude", set())
        data = super().model_dump(*args, exclude=exclude | {"encrypted_auth"}, **kwargs)

        # Only include auth if it's not excluded
        if "auth" not in exclude:
            try:
                auth = self.auth
                if auth:
                    auth_dict = auth.model_dump()

                    # Convert string types back to enum for the response
                    if isinstance(auth_dict.get("type"), str):
                        auth_dict["type"] = AuthType(auth_dict["type"])

                    data["auth"] = auth_dict
                else:
                    data["auth"] = None
            except Exception as e:
                print(f"Error including auth in model_dump: {e}")
                data["auth"] = None

        return data


class ConnectionOut(CamelModel):
    id: str
    name: str
    description: str | None = None
    provider_id: str
    base_url: str | None = None
    auth: AuthConfig | None = None
    owner_id: str
    created_at: datetime
    updated_at: datetime


class ConnectionsOut(CamelModel):
    data: list[ConnectionOut]
    count: int

import os
import secrets
import warnings
from pathlib import Path
from typing import Annotated, Any, Literal

from pydantic import (
    AnyUrl,
    BeforeValidator,
    HttpUrl,
    PostgresDsn,
    computed_field,
    model_validator,
)
from pydantic_core import MultiHostUrl
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Self

env_file: str = ".env"


def get_env_file(env_type="local"):
    global env_file  # Use the global env_file variable
    if env_type == "staging":
        env_file = ".env.staging"
    elif env_type == "production":
        env_file = ".env.production"
    elif env_type == "local":
        env_file = ".env.local"

    # Check if the specified env_file exists, otherwise fall back to .env
    env_path = Path(env_file)
    if not env_path.is_file():
        env_file = ".env"
    return env_file


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    # print(load_environment_variables())
    model_config = SettingsConfigDict(
        env_file=(get_env_file(), ".env"), env_ignore_empty=True, extra="ignore"
    )

    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    DOMAIN: str = "localhost"
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"
    LLM_BASE_URL: str = "http://localhost:11434/v1"
    LLM_API_KEY: str = "dummyapikey"
    LLM_DEFAULT_MODEL: str = "gpt-4o-mini"
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"

    @computed_field  # type: ignore[misc]
    @property
    def UPLOAD_DIR(self) -> str:
        upload_path = Path.home() / ".openastra" / "uploads"
        upload_path.mkdir(parents=True, exist_ok=True)
        return str(upload_path)

    MAX_UPLOAD_SIZE: int = 10_000_000  # 10MB in bytes
    ALLOWED_EXTENSIONS: set = {
        ".txt",
        ".json",
        # ".png",
        # ".jpg",
        # ".jpeg",
        # ".gif",
        # ".doc",
        # ".docx",
        # ".xls",
        # ".xlsx",
        ".csv",
    }

    @computed_field  # type: ignore[misc]
    @property
    def server_host(self) -> str:
        # Use HTTPS for anything other than local development
        if self.ENVIRONMENT == "local":
            return f"http://{self.DOMAIN}"
        return f"https://{self.DOMAIN}"

    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []

    PROJECT_NAME: str
    SENTRY_DSN: HttpUrl | None = None
    POSTGRES_SERVER: str | None = None
    POSTGRES_PORT: int | None = None
    POSTGRES_USER: str | None = None
    POSTGRES_PASSWORD: str | None = None
    POSTGRES_DB: str | None = None
    DB_TYPE: str = "sqlite"

    @computed_field  # type: ignore[misc]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn | Any:
        if self.DB_TYPE == "sqlite":
            db_path = Path.home() / ".openastra" / "app.db"
            db_path.parent.mkdir(parents=True, exist_ok=True)
            return f"sqlite:///{db_path}"

        return MultiHostUrl.build(
            scheme="postgresql+psycopg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    SMTP_PORT: int = 587
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    # TODO: update type to EmailStr when sqlmodel supports it
    EMAILS_FROM_EMAIL: str | None = None
    EMAILS_FROM_NAME: str | None = None

    @model_validator(mode="after")
    def _set_default_emails_from(self) -> Self:
        if not self.EMAILS_FROM_NAME:
            self.EMAILS_FROM_NAME = self.PROJECT_NAME
        return self

    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48

    @computed_field  # type: ignore[misc]
    @property
    def emails_enabled(self) -> bool:
        return bool(self.SMTP_HOST and self.EMAILS_FROM_EMAIL)

    # TODO: update type to EmailStr when sqlmodel supports it
    EMAIL_TEST_USER: str = "test@example.com"
    # TODO: update type to EmailStr when sqlmodel supports it
    FIRST_SUPERUSER: str
    FIRST_SUPERUSER_PASSWORD: str
    USERS_OPEN_REGISTRATION: bool = False

    AMPLITUDE_API_KEY: str = os.getenv(
        "AMPLITUDE_API_KEY", "ef5489b99fbbb64c53c7dc722ddc1d4e"
    )
    TELEMETRY_ENABLED: bool = os.getenv("TELEMETRY_ENABLED", "true").lower() == "true"

    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        if value == "changethis":
            message = (
                f'The value of {var_name} is "changethis", '
                "for security, please change it, at least for deployments."
            )
            if self.ENVIRONMENT == "local":
                warnings.warn(message, stacklevel=1)
            else:
                raise ValueError(message)

    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> Self:
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        self._check_default_secret("POSTGRES_PASSWORD", self.POSTGRES_PASSWORD)
        self._check_default_secret(
            "FIRST_SUPERUSER_PASSWORD", self.FIRST_SUPERUSER_PASSWORD
        )

        return self


settings = Settings()  # type: ignore

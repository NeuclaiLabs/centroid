from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from cryptography.fernet import Fernet
from passlib.context import CryptContext
from sqlmodel import Session

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


ALGORITHM = "HS256"


def get_encryption_key() -> bytes:
    """Get or generate a Fernet encryption key from settings."""
    key = getattr(settings, "ENCRYPTION_KEY", None)
    if not key:
        key = Fernet.generate_key()
        # In production, this key should be stored securely and loaded from environment
        settings.ENCRYPTION_KEY = key.decode()
        return key
    return key.encode() if isinstance(key, str) else key


def encrypt_dict(data: dict) -> str:
    """Encrypt a dictionary to a string."""
    if not data:
        return ""
    f = Fernet(get_encryption_key())
    return f.encrypt(str(data).encode()).decode()


def decrypt_dict(encrypted_data: str) -> dict:
    """Decrypt a string back to a dictionary."""
    if not encrypted_data:
        return {}
    f = Fernet(get_encryption_key())
    decrypted = f.decrypt(encrypted_data.encode()).decode()
    # Convert string representation of dict back to dict
    # Remove the leading/trailing quotes and evaluate the string as a Python literal
    return eval(decrypted)


def create_access_token(subject: str | Any, expires_delta: timedelta) -> str:
    expire = datetime.now(UTC) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


async def load_secrets_to_env(session: Session) -> None:
    """Load all secrets into environment variables on startup."""
    import os

    from sqlmodel import select

    from app.core.logger import get_logger
    from app.models import Secret

    logger = get_logger(__name__, service="secrets")

    try:
        # Query all secrets
        statement = select(Secret)
        secrets = session.exec(statement).all()

        # Load each secret into environment
        for secret in secrets:
            env_key = f"{secret.environment.upper()}_{secret.name.upper()}"
            if secret.value is not None:
                os.environ[env_key] = secret.value
                logger.info(f"Loaded secret: {env_key}")
            else:
                logger.warning(f"Skipped loading secret with null value: {env_key}")

        logger.info(
            f"Successfully loaded {len(secrets)} secrets into environment variables"
        )
    except Exception as e:
        logger.error(f"Failed to load secrets into environment: {str(e)}")
        raise e

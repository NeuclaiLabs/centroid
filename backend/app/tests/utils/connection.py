import random
import string

from sqlmodel import Session

from app.models import ApiKeyAuth, AuthConfig, AuthType, Connection


def random_lower_string() -> str:
    return "".join(random.choices(string.ascii_lowercase, k=32))


def create_random_connection(
    db: Session,
) -> Connection:
    name = random_lower_string()
    description = random_lower_string()
    kind = random.choice(["api", "oauth2", "basic"])
    base_url = f"https://{random_lower_string()}.com"

    # Create a valid AuthConfig object
    auth_config = AuthConfig(
        type=AuthType.API_KEY,
        config=ApiKeyAuth(
            key=random_lower_string(), value=random_lower_string(), location="header"
        ),
    )

    connection_in = Connection(
        name=name,
        description=description,
        kind=kind,
        base_url=base_url,
        auth=auth_config,
    )
    db.add(connection_in)
    db.commit()
    db.refresh(connection_in)
    return connection_in

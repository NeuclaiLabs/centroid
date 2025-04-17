import random
import string

from sqlmodel import Session

from app.models.connection import ApiKeyAuth, AuthConfig, AuthType, Connection
from app.tests.utils.utils import random_string


def random_lower_string() -> str:
    return "".join(random.choices(string.ascii_lowercase, k=32))


def create_random_connection(*, session: Session, owner_id: str) -> Connection:
    """Create a random connection for testing."""
    auth_config = AuthConfig(
        type=AuthType.API_KEY,
        config=ApiKeyAuth(key="X-API-Key", value="test-key", location="header"),
    )

    connection = Connection(
        name=f"Test Connection {random_string()}",
        description=f"Test Description {random_string()}",
        provider_id=random_string(),
        base_url="https://api.example.com",
        auth=auth_config,
        owner_id=owner_id,
    )

    session.add(connection)
    session.commit()
    session.refresh(connection)

    return connection

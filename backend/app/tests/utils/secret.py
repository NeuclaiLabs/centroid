from sqlmodel import Session

from app.models.secret import Secret
from app.tests.utils.utils import random_string


def create_random_secret(*, session: Session, owner_id: str) -> Secret:
    """Create a random secret for testing."""
    secret = Secret(
        name=f"TEST_SECRET_{random_string()}",
        description=f"Test secret description {random_string()}",
        value=f"secret-value-{random_string()}",
        environment="development",
        owner_id=owner_id,
    )
    session.add(secret)
    session.commit()
    session.refresh(secret)
    return secret

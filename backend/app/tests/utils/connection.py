import random

from sqlmodel import Session

from app import crud
from app.models import Connection, ConnectionCreate
from app.tests.utils.user import create_random_user
from app.tests.utils.utils import random_lower_string


def create_random_connection(db: Session) -> Connection:
    user = create_random_user(db)
    owner_id = user.id
    assert owner_id is not None
    name = random_lower_string()
    type = random.choice(["type1", "type2", "type3"])
    data = {"key": random_lower_string(), "value": random_lower_string()}
    connection_in = ConnectionCreate(name=name, type=type, data=data)
    return crud.create_connection(
        session=db, connection_in=connection_in, owner_id=owner_id
    )

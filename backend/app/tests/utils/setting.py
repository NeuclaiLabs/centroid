import random

from sqlmodel import Session

from app import crud
from app.models import Setting, SettingCreate
from app.tests.utils.user import create_random_user
from app.tests.utils.utils import random_lower_string


def create_random_setting(db: Session) -> Setting:
    user = create_random_user(db)
    owner_id = user.id
    assert owner_id is not None
    name = random_lower_string()
    kind = random.choice(["kind1", "kind2", "kind3"])
    data = {"key": random_lower_string(), "value": random_lower_string()}
    setting_create = SettingCreate(name=name, kind=kind, data=data)
    return crud.create_setting(
        session=db, setting_create=setting_create, owner_id=owner_id
    )

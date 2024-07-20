import random

from sqlmodel import Session

from app.models import ToolCall, ToolCallCreate
from app.tests.utils.user import create_random_user
from app.tests.utils.utils import random_lower_string, random_string


def create_random_tool_call(db: Session) -> ToolCall:
    user = create_random_user(db)
    owner_id = user.id
    assert owner_id is not None

    chat_id = random_string()
    kind = random.choice(["kind1", "kind2", "kind3"])
    result = (
        {
            "result_key": random_lower_string(),
            "result_value": random_lower_string(),
        }
        if random.random() < 0.5
        else None
    )
    status = random.choice(["pending", "in_progress", "completed", "failed"])
    payload = {
        "key1": random_lower_string(),
        "key2": random_lower_string(),
    }

    tool_call_create = ToolCallCreate(
        chat_id=chat_id,
        kind=kind,
        result=result,
        status=status,
        payload=payload,
    )

    tool_call = ToolCall(**tool_call_create.dict(), owner_id=owner_id)
    db.add(tool_call)
    db.commit()
    db.refresh(tool_call)
    return tool_call

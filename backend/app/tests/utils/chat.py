from datetime import datetime

from sqlmodel import Session

from app import crud
from app.models import Chat, Message
from app.tests.utils.user import create_random_user
from app.tests.utils.utils import random_lower_string, random_string


def create_random_chat(db: Session) -> Chat:
    user = create_random_user(db)
    user_id = str(user.id)

    chat_id = random_string()
    title = random_lower_string()
    path = random_lower_string()

    chat_message = Message(
        id=random_string(),
        role="system",
        name="Bot",
        parts=[random_lower_string()],
        attachments=None,
    )

    chat = Chat(
        id=chat_id,
        title=title,
        path=path,
        user_id=user_id,
        messages=[chat_message],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    return crud.create_chat(session=db, chat=chat)

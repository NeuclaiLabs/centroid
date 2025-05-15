from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    MessageCreate,
    MessageOut,
    MessagesOut,
)
from app.models.utils import UtilsMessage

router = APIRouter()


@router.get("/", response_model=MessagesOut)
def read_messages(
    session: SessionDep,
    chat_id: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve messages. Optionally filter by chat_id.
    """
    # Base query conditions
    conditions = []

    # Add filters if provided
    if chat_id:
        conditions.append(Message.chat_id == chat_id)

    # Get count
    statement = select(func.count()).select_from(Message).where(*conditions)
    count = session.exec(statement).one()

    # Get messages
    statement = (
        select(Message)
        .where(*conditions)
        .order_by(Message.created_at.asc())
        .offset(skip)
        .limit(limit)
    )
    messages = session.exec(statement).all()

    # Convert Message instances to MessageOut instances
    message_out_list = [
        MessageOut.model_validate(message.model_dump()) for message in messages
    ]
    return MessagesOut(data=message_out_list, count=count)


@router.get("/{id}", response_model=MessageOut)
def read_message(session: SessionDep, id: str) -> MessageOut:
    """
    Get message by ID.
    """
    message = session.get(Message, id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return message


@router.post("/", response_model=UtilsMessage)
def create_message(*, session: SessionDep, messages: list[MessageCreate]) -> Any:
    """
    Create new messages.
    Expects a list of message objects.
    """
    try:
        # Convert Pydantic models to dictionaries before creating Message instances
        db_messages = [Message(**msg.model_dump(by_alias=False)) for msg in messages]
        session.add_all(db_messages)
        session.commit()
        return UtilsMessage(message="Messages created successfully")
    except Exception as e:
        # Log the error properly instead of print
        raise HTTPException(
            status_code=400, detail=f"Failed to create messages: {str(e)}"
        )


@router.delete("/{id}")
def delete_message(session: SessionDep, current_user: CurrentUser, id: str) -> dict:
    """
    Delete message.
    """
    message = session.get(Message, id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Only superusers can delete messages
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")

    session.delete(message)
    session.commit()
    return {"message": "Message deleted successfully"}

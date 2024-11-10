from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Chat,
    ChatOut,
    ChatsOut,
    ChatUpdate,
    Message,
)

router = APIRouter()


@router.get("/", response_model=ChatsOut)
def read_chats(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve chats.
    """
    # if current_user.is_superuser:
    #     statement = select(func.count()).select_from(Chat)
    #     count = session.exec(statement).one()
    #     statement = (
    #         select(Chat).order_by(Chat.created_at.desc()).offset(skip).limit(limit)
    #     )
    #     chats = session.exec(statement).all()
    # else:
    statement = (
        select(func.count()).select_from(Chat).where(Chat.user_id == current_user.id)
    )
    count = session.exec(statement).one()
    statement = (
        select(Chat)
        .where(Chat.user_id == current_user.id)
        .order_by(Chat.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    chats = session.exec(statement).all()
    chat_out_list = [
        ChatOut(**chat.dict(exclude={"project"}), project=chat.project)
        for chat in chats
    ]
    return ChatsOut(data=chat_out_list, count=count)


@router.get("/{id}", response_model=ChatOut)
def read_chat(session: SessionDep, current_user: CurrentUser, id: str) -> ChatOut:
    """
    Get item by ID.
    """
    chat = session.get(Chat, id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if not current_user.is_superuser and (chat.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return chat


@router.post("/", response_model=Chat)
def create_or_update_chat(
    *, session: SessionDep, current_user: CurrentUser, chat: Chat
) -> Any:
    """
    Create or update a chat.
    """
    # Get the existing chat, if any
    existing_chat: Chat = session.get(Chat, chat.id)

    # If the chat doesn't exist, create a new one
    if not existing_chat:
        # Set the user_id before validation to ensure it's included in the model
        chat_dict = chat.model_dump()
        chat_dict["user_id"] = str(current_user.id)
        chat = Chat.model_validate(chat_dict)
        session.add(chat)
        session.commit()
        session.refresh(chat)
        return chat

    # Otherwise, update the existing chat
    if not current_user.is_superuser and (existing_chat.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = chat.model_dump(exclude_unset=True)
    existing_chat.sqlmodel_update(update_dict)
    session.add(existing_chat)
    session.commit()
    session.refresh(existing_chat)
    return existing_chat


@router.put("/{id}", response_model=Chat)
def update_chat(
    *, session: SessionDep, current_user: CurrentUser, id: str, chat_in: ChatUpdate
) -> Chat:
    """
    Update chat.
    """
    chat: Chat = session.get(Chat, id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if not current_user.is_superuser and (chat.user_id != str(current_user.id)):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = chat_in.model_dump(exclude_unset=True)
    chat.sqlmodel_update(update_dict)
    session.add(chat)
    session.commit()
    session.refresh(chat)
    return chat


@router.delete("/{id}")
def delete_chat(session: SessionDep, current_user: CurrentUser, id: str) -> Any:
    """
    Delete chat.
    """
    chat: Chat = session.get(Chat, id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if not current_user.is_superuser and (chat.user_id != str(current_user.id)):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(chat)
    session.commit()
    return Message(message="Chat deleted successfully")


@router.delete("/")
def delete_all_user_chats(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete all chats for a user.
    """
    session.query(Chat).filter(Chat.user_id == str(current_user.id)).delete()
    session.commit()
    return Message(message="All chats deleted successfully")

from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Chat,
    Stream,
    StreamCreate,
    StreamOut,
    StreamsOut,
    StreamUpdate,
    UtilsMessage,
)

router = APIRouter()


@router.get("/", response_model=StreamsOut)
def read_streams(
    session: SessionDep,
    current_user: CurrentUser,
    chat_id: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve streams.
    """
    if chat_id:
        # First verify the chat belongs to the current user or they're a superuser
        chat = session.get(Chat, chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        if not current_user.is_superuser and chat.user_id != current_user.id:
            raise HTTPException(status_code=400, detail="Not enough permissions")

        # Get streams for specific chat
        statement = (
            select(func.count()).select_from(Stream).where(Stream.chat_id == chat_id)
        )
        count = session.exec(statement).one()

        statement = (
            select(Stream)
            .where(Stream.chat_id == chat_id)
            .offset(skip)
            .limit(limit)
            .order_by(Stream.created_at.asc())
        )
        streams = session.exec(statement).all()
    else:
        # Get all streams (superuser) or streams from user's chats
        if current_user.is_superuser:
            statement = select(func.count()).select_from(Stream)
            count = session.exec(statement).one()
            statement = (
                select(Stream)
                .offset(skip)
                .limit(limit)
                .order_by(Stream.created_at.desc())
            )
            streams = session.exec(statement).all()
        else:
            # Get streams from user's chats only
            statement = (
                select(func.count())
                .select_from(Stream)
                .join(Chat)
                .where(Chat.user_id == current_user.id)
            )
            count = session.exec(statement).one()

            statement = (
                select(Stream)
                .join(Chat)
                .where(Chat.user_id == current_user.id)
                .offset(skip)
                .limit(limit)
                .order_by(Stream.created_at.desc())
            )
            streams = session.exec(statement).all()

    return StreamsOut(data=streams, count=count)


@router.get("/{id}", response_model=StreamOut)
def read_stream(session: SessionDep, current_user: CurrentUser, id: str) -> Any:
    """
    Get stream by ID.
    """
    stream = session.get(Stream, id)
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    # Check if user owns the chat this stream belongs to
    chat = session.get(Chat, stream.chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Associated chat not found")

    if not current_user.is_superuser and chat.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")

    return stream


@router.post("/", response_model=StreamOut)
def create_stream(
    *, session: SessionDep, current_user: CurrentUser, stream_in: StreamCreate
) -> Any:
    """
    Create new stream.
    """
    # Verify the chat exists and belongs to the current user
    chat = session.get(Chat, stream_in.chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if not current_user.is_superuser and chat.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")

    # Create stream with provided ID or generate one
    if stream_in.id:
        # Check if stream with this ID already exists
        existing_stream = session.get(Stream, stream_in.id)
        if existing_stream:
            raise HTTPException(
                status_code=400, detail="Stream with this ID already exists"
            )

        stream = Stream.model_validate(stream_in)
    else:
        # Let the database generate the ID
        import uuid

        stream_data = stream_in.model_dump()
        stream_data["id"] = str(uuid.uuid4())
        stream = Stream.model_validate(stream_data)

    session.add(stream)
    session.commit()
    session.refresh(stream)
    return stream


@router.put("/{id}", response_model=StreamOut)
def update_stream(
    *, session: SessionDep, current_user: CurrentUser, id: str, stream_in: StreamUpdate
) -> Any:
    """
    Update a stream.
    """
    stream = session.get(Stream, id)
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    # Check if user owns the chat this stream belongs to
    chat = session.get(Chat, stream.chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Associated chat not found")

    if not current_user.is_superuser and chat.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")

    # If updating chat_id, verify the new chat exists and user has access
    if stream_in.chat_id and stream_in.chat_id != stream.chat_id:
        new_chat = session.get(Chat, stream_in.chat_id)
        if not new_chat:
            raise HTTPException(status_code=404, detail="New chat not found")
        if not current_user.is_superuser and new_chat.user_id != current_user.id:
            raise HTTPException(
                status_code=400, detail="Not enough permissions for new chat"
            )

    update_dict = stream_in.model_dump(exclude_unset=True)
    stream.sqlmodel_update(update_dict)
    session.add(stream)
    session.commit()
    session.refresh(stream)
    return stream


@router.delete("/{id}")
def delete_stream(
    session: SessionDep, current_user: CurrentUser, id: str
) -> UtilsMessage:
    """
    Delete a stream.
    """
    stream = session.get(Stream, id)
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    # Check if user owns the chat this stream belongs to
    chat = session.get(Chat, stream.chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Associated chat not found")

    if not current_user.is_superuser and chat.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")

    session.delete(stream)
    session.commit()
    return UtilsMessage(message="Stream deleted successfully")

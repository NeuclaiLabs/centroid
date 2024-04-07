from datetime import datetime

import nanoid
from sqlalchemy import Column, DateTime, event, func
from sqlmodel import JSON, Field, SQLModel


class ChatMessage(SQLModel):
    id: str
    role: str
    name: str | None = None
    content: str

    def to_dict(self):
        return self.dict()


class ChatBase(SQLModel):
    title: str | None
    path: str | None


# Shared properties
class Chat(ChatBase, table=True):
    id: str = Field(primary_key=True, default_factory=nanoid.generate)
    user_id: str = Field(alias="userId")
    messages: list[ChatMessage] | None = Field(sa_column=Column(JSON))
    created_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={
            "server_default": func.now(),
        },
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": func.now(), "server_default": func.now()},
    )


class ChatUpdate(SQLModel):
    title: str | None
    messages: list[ChatMessage] | None
    updated_at: datetime = datetime.utcnow()


class ChatOut(ChatBase):
    id: str
    user_id: str


class ChatsOut(SQLModel):
    data: list[ChatOut]
    count: int


# Automatically serialize ChatMessage objects before inserting into the database
def before_insert_listener(mapper, connection, target):  # noqa: ARG001
    if target.messages:
        target.messages = [message.dict() for message in target.messages]


# Automatically deserialize ChatMessage objects after loading from the database
def after_load_listener(target, context):  # noqa: ARG001
    if target.messages:
        target.messages = [ChatMessage(**message) for message in target.messages]


# Bind event listeners

event.listen(Chat, "before_insert", before_insert_listener)
event.listen(Chat, "load", after_load_listener)

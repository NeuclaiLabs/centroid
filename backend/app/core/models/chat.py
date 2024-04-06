from datetime import datetime

import nanoid
from sqlalchemy import Column, DateTime, event, func
from sqlmodel import JSON, Field, SQLModel


class ChatMessage(SQLModel):
    id: str
    role: str
    name: str | None = Field(default="")
    content: str

    def to_dict(self):
        return self.dict()


class ChatBase(SQLModel):
    title: str | None
    path: str | None


# Shared properties
class Chat(ChatBase, table=True):
    id: str = Field(primary_key=True, default_factory=nanoid.generate)
    user_id: str
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
def before_insert_listener(mapper, connection, target):
    if target.messages:
        target.messages = [message.dict() for message in target.messages]


# Automatically deserialize ChatMessage objects after loading from the database
def after_load_listener(target, context):
    if target.messages:
        target.messages = [ChatMessage(**message) for message in target.messages]


# Bind event listeners

event.listen(Chat, "before_insert", before_insert_listener)
event.listen(Chat, "load", after_load_listener)


# if __name__ == "__main__":
#     # Create an in-memory SQLite database
#     DATABASE_URL = "sqlite:////Users/srikanth/gitspace/openastra/backend/app/models/test.db"
#     engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

#     # Create the tables
#     SQLModel.metadata.create_all(engine)

#     # Create a Session class to interact with the database
#     SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#     # Create a new Chat instance
#     new_chat = Chat(
#         title="list trending stocks",
#         path="/chat/JzyMvkK",
#         messages=[
#             Message(id="pUPuaZj", role="user", name="list trending stocks", content="list trending stocks").to_dict(),
#             Message(id="QgnXc32", role="function", name="listStocks", content="[...]").to_dict(),
#             Message(id="BZyHtXA", role="user", name="View AMZN", content="View AMZN").to_dict(),
#             Message(id="acO9d6b", role="function", name="showStockPrice", content="{...}").to_dict()
#         ]
#     )

#     # Create a new session
#     with SessionLocal() as session:
#         # Add the new chat to the session
#         session.add(new_chat)
#         # Commit the transaction to persist the new chat to the database
#         session.commit()

#     # Retrieve a chat by ID
#     # with SessionLocal() as session:
#     #     chat = session.query(Chat).filter_by(id="332c7229-db93-4457-abdf-b620f7af267c").first()
#     #     print(chat.get_messages())

#     # Update a chat
#     with SessionLocal() as session:
#         chat = session.query(Chat).first()
#         print(type(chat.messages))
#         chat.title = "Updated title"
#         session.commit()

# # # Delete a chat
# # with SessionLocal() as session:
# #     chat = session.query(Chat).filter_by(id="chat_id").first()
# #     session.delete(chat)
# #     session.commit()

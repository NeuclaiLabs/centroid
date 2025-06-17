import nanoid
from sqlmodel import Field, Relationship, SQLModel  # Shared properties

from .user import User


class ItemBase(SQLModel):
    title: str = Field(index=True)
    description: str | None = None


# Properties to receive on item creation
class ItemCreate(ItemBase):
    title: str


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = None  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: str = Field(default_factory=nanoid.generate, primary_key=True)
    owner_id: str = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemOut(ItemBase):
    id: str
    owner_id: str


class ItemsOut(SQLModel):
    data: list[ItemOut]
    count: int

import nanoid
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
# TODO replace email str with EmailStr when sqlmodel supports it
class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = None


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str


# TODO replace email str with EmailStr when sqlmodel supports it
class UserRegister(SQLModel):
    email: str
    password: str
    full_name: str | None = None


# Properties to receive via API on update, all are optional
# TODO replace email str with EmailStr when sqlmodel supports it
class UserUpdate(UserBase):
    email: str | None = None  # type: ignore
    password: str | None = None


# TODO replace email str with EmailStr when sqlmodel supports it
class UserUpdateMe(SQLModel):
    full_name: str | None = None
    email: str | None = None


class UpdatePassword(SQLModel):
    current_password: str
    new_password: str


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: str | None = Field(default_factory=nanoid.generate, primary_key=True)
    test2: str | None = Field(default_factory=nanoid.generate)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner")  # noqa: F821
    connections: list["Connection"] = Relationship(back_populates="owner")  # noqa: F821


# Properties to return via API, id is always required
class UserOut(UserBase):
    id: str


class UsersOut(SQLModel):
    data: list[UserOut]
    count: int

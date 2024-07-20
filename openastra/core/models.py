from pydantic import BaseModel


class BaseConfig(BaseModel):
    pass


class BaseContext(BaseModel):
    kind: str
    pass

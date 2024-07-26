from pydantic import BaseModel


class BaseToolConfig(BaseModel):
    pass


class BaseToolContext(BaseModel):
    kind: str
    pass

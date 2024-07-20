from abc import ABC, abstractmethod

from pydantic import BaseModel


class BaseConfig(BaseModel):
    pass


class BaseContext(BaseModel):
    kind: str
    pass


class BaseTool(ABC):
    _metrics: dict

    def __init__(self, name: str, context: BaseContext, config: BaseConfig):
        self.name = name
        self.context = context
        self.config = config

    @abstractmethod
    def run(self):
        pass

from abc import ABC, abstractmethod

from pydantic import BaseModel, Field


class BaseToolConfig(BaseModel):
    pass


class BaseToolContext(BaseModel):
    pass


class BaseResult(BaseModel):
    result: int | float | str | dict | None = Field(
        None, description="The result of the calculation"
    )
    execution_time: float = Field(
        ..., description="Total time taken for execution in seconds"
    )
    status: str = Field(
        ..., description="Status of the execution, either 'success' or 'error'"
    )
    error_message: str | None = Field(
        None, description="Error message in case of an error"
    )


class BaseTool(ABC):
    _metrics: dict
    _name: str

    def __init__(self, name: str, context: BaseToolContext, config: BaseToolConfig):
        self._name = name
        self.context = context
        self.config = config

    @property
    def name(self) -> str:
        return self._name

    @abstractmethod
    def run(self) -> BaseResult:
        pass

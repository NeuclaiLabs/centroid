from openastra.tools.base import BaseToolArgs, BaseToolConfig, BaseToolContext


class CalculatorToolConfig(BaseToolConfig):
    pass


class CalculatorToolArgs(BaseToolArgs):
    expression: str


class CalculatorToolContext(BaseToolContext):
    timeout: int = 30
    args: CalculatorToolArgs

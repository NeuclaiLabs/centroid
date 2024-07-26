from openastra.tools.base import BaseToolConfig, BaseToolContext


class CalculatorToolConfig(BaseToolConfig):
    pass


class CalculatorToolContext(BaseToolContext):
    kind: str = "calculator"
    timeout: int = 30
    args: dict
    model: dict

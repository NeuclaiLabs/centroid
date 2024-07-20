from openastra.tools.base import BaseConfig, BaseContext


class CalculatorConfig(BaseConfig):
    pass


class CalculatorContext(BaseContext):
    kind: str = "calculator"
    expression: str
    timeout: int = 30

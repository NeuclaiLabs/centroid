import time

from openastra.core.logger import logger
from openastra.tools.base import BaseTool, BaseToolResult
from openastra.tools.calculator.models import (
    CalculatorToolConfig,
    CalculatorToolContext,
)


class CalculatorTool(BaseTool):
    _name = "calculator"

    def __init__(self, context: CalculatorToolContext, config: CalculatorToolConfig):
        super().__init__(
            self._name,
            CalculatorToolContext(**context),
            CalculatorToolConfig(**{}),
        )

    def run(self) -> BaseToolResult:
        start_time = time.time()
        try:
            print(f"Expression: { self.context.args.expression}")
            # Use the built-in eval function to evaluate the expression
            result = eval(self.context.args.expression)
            end_time = time.time()
            execution_time_ms = (end_time - start_time) * 1000
            execution_time_ms = round(execution_time_ms, 2)
            return {
                "result": result,
                "execution_time": execution_time_ms,
                "status": "success",
            }
        except Exception as e:
            end_time = time.time()
            execution_time_ms = (end_time - start_time) * 1000
            execution_time_ms = round(execution_time_ms, 2)
            logger.exception(e)
            return {
                "result": None,
                "execution_time": execution_time_ms,
                "status": "error",
                "error": str(e),
            }

import time

from openastra.core.logger import logger
from openastra.tools.base import BaseResult, BaseTool
from openastra.tools.calculator.models import CalculatorConfig, CalculatorContext


class CalculatorTool(BaseTool):
    _name = "calculator"

    def __init__(self, context: CalculatorContext, config: CalculatorConfig):
        super().__init__(
            self._name,
            CalculatorContext(**context),
            CalculatorConfig(**config[self._name]),
        )

    def run(self) -> BaseResult:
        start_time = time.time()
        try:
            # Use the built-in eval function to evaluate the expression
            result = eval(self.context.expression)
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
            logger.exception(e)
            return {
                "result": None,
                "execution_time": execution_time_ms,
                "status": "error",
                "error": str(e),
            }


if __name__ == "__main__":
    calculator = CalculatorTool(
        context={
            "expression": "1+2**5%3-23+1+2**5%3-23+1+2**5%3-23",
            "args": {},
        },
        config={"general": {}, "web_search": {}, "calculator": {}},
    )
    logger.info(calculator.run())

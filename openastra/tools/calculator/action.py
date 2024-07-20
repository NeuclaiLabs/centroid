from openastra.core.logger import logger
from openastra.tools.base import BaseTool
from openastra.tools.calculator.models import CalculatorConfig, CalculatorContext


class CalculatorTool(BaseTool):
    _name = "calculator"

    def __init__(self, context: CalculatorContext, config: CalculatorConfig):
        super().__init__(
            self._name,
            CalculatorContext(**context),
            CalculatorConfig(**config[self._name]),
        )

    def run(self):
        try:
            # Use the built-in eval function to evaluate the expression
            result = eval(self.context.expression)
            return result
        except Exception as e:
            logger.exception(e)


if __name__ == "__main__":
    calculator = CalculatorTool(
        context={
            "expression": "1+2**5%3-23",
            "args": {},
        },
        config={"general": {}, "web_search": {}, "calculator": {}},
    )
    logger.info(calculator.run())

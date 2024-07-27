from openastra.tools import CalculatorTool
from openastra.tools.base import (
    BaseTool,
    BaseToolConfig,
    BaseToolContext,
    BaseToolResult,
)


class ToolRegistry:
    _registry: dict[str, type[BaseTool]] = {}

    @classmethod
    def register_tool(cls, tool_cls: type[BaseTool]):
        cls._registry[tool_cls._name] = tool_cls

    @classmethod
    def get_tool(cls, name: str) -> type[BaseTool]:
        tool_cls = cls._registry.get(name)
        if not tool_cls:
            raise ValueError(f"Tool '{name}' is not registered.")
        return tool_cls


class ToolRunner:
    def __init__(self, config: BaseToolConfig, context: BaseToolContext, name: str):
        self.config = config
        self.context = context
        self.name = name
        self.tool_instance = self._create_tool_instance()

    def _create_tool_instance(self) -> BaseTool:
        tool_cls = ToolRegistry.get_tool(self.name)
        return tool_cls(context=self.context, config=self.config)

    def run(self) -> BaseToolResult:
        return self.tool_instance.run()


def register_tools():
    ToolRegistry.register_tool(CalculatorTool)
    # ToolRegistry.register_tool(WebSearchTool)


register_tools()

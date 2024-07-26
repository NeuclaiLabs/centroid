# main.py

from openastra.tools.base import BaseConfig, BaseToolContext
from openastra.tools.tool_runner import ToolRunner


def main():
    # Example usage
    config = BaseConfig()
    context = BaseToolContext(kind="example")
    tool_name = "calculator"
    context = {
        "expression": "1+2**5%3-23",
        "args": {},
    }

    config = {"general": {}, "web_search": {}, "calculator": {}}

    runner = ToolRunner(config=config, context=context, name=tool_name)
    result = runner.run()
    print(result)


if __name__ == "__main__":
    main()

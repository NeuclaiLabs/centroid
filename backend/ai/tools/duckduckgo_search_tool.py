from langchain_community.tools import DuckDuckGoSearchResults
from langchain_core.tools import ToolException


def _handle_error(error: ToolException) -> str:
    return (
        "The following errors occurred during tool execution:"
        + error.args[0]
        + "Please try another tool."
    )


DuckDuckGoSearchTool = DuckDuckGoSearchResults()

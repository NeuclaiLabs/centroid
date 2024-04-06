from langchain.pydantic_v1 import BaseModel, Field
from langchain.tools import StructuredTool
from langchain_community.tools import DuckDuckGoSearchResults
from openastra.utils import handle_error


class DuckDuckGoSearchInput(BaseModel):
    query: str = Field(description="Content of search query.")


def search(query: str):
    return DuckDuckGoSearchResults().run(query)


DuckDuckGoSearchTool = StructuredTool.from_function(
    func=search,
    name="tavily_search",
    description="Search for results on DuckDuckgo",
    args_schema=DuckDuckGoSearchInput,
    return_direct=True,
    handle_tool_error=handle_error,
)

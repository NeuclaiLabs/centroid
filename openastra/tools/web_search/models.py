from pydantic import Field

from openastra.tools.base import BaseToolConfig, BaseToolContext


class SearchConfig(BaseToolConfig):
    api_key: str
    base_url: str
    num_results: int = 10
    blacklisted_urls: list[str] | None = None
    language: str = "en"
    country: str = "us"
    safe_search: bool = True


class SearchContext(BaseToolContext):
    kind: str = Field("search", literal=True)
    query: str
    timeout: int = 30

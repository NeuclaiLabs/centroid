from pydantic import Field

from openastra.tools.base import BaseConfig, BaseContext


class SearchConfig(BaseConfig):
    api_key: str
    base_url: str
    num_results: int = 10
    blacklisted_urls: list[str] | None = None
    language: str = "en"
    country: str = "us"
    safe_search: bool = True


class SearchContext(BaseContext):
    kind: str = Field("search", literal=True)
    query: str
    timeout: int = 30

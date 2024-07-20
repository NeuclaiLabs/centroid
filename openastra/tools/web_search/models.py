from pydanic import Field

from openastra.openastra.tools.base import BaseConfigModel, BaseContextModel


class SearchConfig(BaseConfigModel):
    api_key: str
    base_url: str
    num_results: int = 10
    blacklisted_urls: list[str] | None = None
    language: str = "en"
    country: str = "us"
    safe_search: bool = True


class SearchContext(BaseContextModel):
    kind: str = Field("search", const=True)
    query: str
    timeout: int = 30

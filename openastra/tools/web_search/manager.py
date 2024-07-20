from abc import ABC, abstractmethod

import requests

from openastra.tools.web_search.config import SearchConfig
from openastra.tools.web_search.context import SearchContext
from openastra.tools.web_search.factory import SearchProviderFactory


class SearchProvider(ABC):
    def __init__(self, config: SearchConfig, context: SearchContext):
        self.config = config
        self.context = context

    def _build_common_params(self, query: str) -> dict:
        return {
            "q": self.context.query,
            "language": self.config.language,
            "country": self.config.country,
        }

    @abstractmethod
    def _build_specific_params(self, common_params: dict) -> dict:
        pass

    def search(self, query: str) -> dict:
        common_params = self._build_common_params(query)
        params = self._build_specific_params(common_params)
        headers = self._get_headers()
        return self._make_request(params, headers)

    @abstractmethod
    def _get_headers(self) -> dict:
        pass

    def _make_request(self, params: dict, headers: dict) -> dict:
        try:
            response = requests.get(
                self.config.base_url, params=params, headers=headers
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"An error occurred with {self.__class__.__name__}: {e}")
            return {}


class SerperProvider(SearchProvider):
    def _build_specific_params(self, common_params: dict) -> dict:
        common_params.update(
            {
                "num": self.config.num_results,
                "engine": "google",
                "hl": common_params.pop("language"),
                "gl": common_params.pop("country"),
                "safe": "active" if self.config.safe_search else "off",
            }
        )
        return common_params

    def _get_headers(self) -> dict:
        return {"X-API-KEY": self.config.api_key, "Content-Type": "application/json"}


class BingProvider(SearchProvider):
    def _build_specific_params(self, common_params: dict) -> dict:
        common_params.update(
            {
                "count": self.config.num_results,
                "mkt": f"{common_params.pop('language')}-{common_params.pop('country')}",
                "safeSearch": "Strict" if self.config.safe_search else "Off",
            }
        )
        return common_params

    def _get_headers(self) -> dict:
        return {"Ocp-Apim-Subscription-Key": self.config.api_key}


class KagiProvider(SearchProvider):
    def _build_specific_params(self, common_params: dict) -> dict:
        common_params.update(
            {
                "limit": self.config.num_results,
                "safe": "on" if self.config.safe_search else "off",
            }
        )
        common_params.pop("country")  # Kagi doesn't use country in its API
        return common_params

    def _get_headers(self) -> dict:
        return {"Authorization": f"Bot {self.config.api_key}"}


class SearchManager:
    def __init__(self):
        self.factory = SearchProviderFactory()

    def search(self, provider: str, query: str, config: SearchConfig) -> dict:
        search_provider = self.factory.get_provider(provider, config)
        results = search_provider.search(query)
        return self._filter_results(results, provider, config.blacklisted_urls)

    def _filter_results(
        self, results: dict, provider: str, blacklisted_urls: list[str] | None
    ) -> dict:
        if not blacklisted_urls:
            return results

        if provider == "serper":
            results["organic"] = [
                r
                for r in results.get("organic", [])
                if r.get("link") not in blacklisted_urls
            ]
        elif provider == "bing":
            results["webPages"]["value"] = [
                r
                for r in results.get("webPages", {}).get("value", [])
                if r.get("url") not in blacklisted_urls
            ]
        elif provider == "kagi":
            results["data"] = [
                r
                for r in results.get("data", [])
                if r.get("url") not in blacklisted_urls
            ]

        return results


def display_results(results: dict, provider: str):
    if provider == "serper":
        for i, result in enumerate(results.get("organic", []), 1):
            print(f"\n--- Result {i} ---")
            print(f"Title: {result.get('title', 'N/A')}")
            print(f"URL: {result.get('link', 'N/A')}")
            print(f"Snippet: {result.get('snippet', 'N/A')}")
    elif provider == "bing":
        for i, result in enumerate(results.get("webPages", {}).get("value", []), 1):
            print(f"\n--- Result {i} ---")
            print(f"Title: {result.get('name', 'N/A')}")
            print(f"URL: {result.get('url', 'N/A')}")
            print(f"Snippet: {result.get('snippet', 'N/A')}")
    elif provider == "kagi":
        for i, result in enumerate(results.get("data", []), 1):
            print(f"\n--- Result {i} ---")
            print(f"Title: {result.get('title', 'N/A')}")
            print(f"URL: {result.get('url', 'N/A')}")
            print(f"Snippet: {result.get('snippet', 'N/A')}")


def main():
    search_manager = SearchManager()
    provider = input("Enter the search provider (serper/bing/kagi): ").lower()
    api_key = input("Enter your API key: ")
    base_url = input("Enter the base URL for the API: ")
    query = input("Enter your search query: ")
    num_results = int(input("Enter the number of results (default is 10): ") or 10)
    blacklisted_urls = (
        input("Enter blacklisted URLs (comma-separated, optional): ").split(",")
        if input("Do you want to blacklist any URLs? (y/n): ").lower() == "y"
        else None
    )
    language = input("Enter language code (default is 'en'): ") or "en"
    country = input("Enter country code (default is 'us'): ") or "us"
    safe_search = input("Enable safe search? (y/n, default is y): ").lower() != "n"

    config = SearchConfig(
        api_key=api_key,
        base_url=base_url,
        num_results=num_results,
        blacklisted_urls=blacklisted_urls,
        language=language,
        country=country,
        safe_search=safe_search,
    )

    try:
        results = search_manager.search(provider, query, config)
        if results:
            display_results(results, provider)
        else:
            print("No results found or an error occurred.")
    except ValueError as e:
        print(e)


if __name__ == "__main__":
    main()

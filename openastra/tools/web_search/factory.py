from openastra.tools.web_search.manager import (
    BingProvider,
    KagiProvider,
    SearchProvider,
    SerperProvider,
)


class SearchProviderFactory:
    @staticmethod
    def get_provider(name: str, base_url: str, api_key: str) -> SearchProvider:
        providers = {
            "serper": SerperProvider(api_key=api_key, base_url=base_url),
            "bing": BingProvider(api_key=api_key, base_url=base_url),
            "kagi": KagiProvider(api_key=api_key, base_url=base_url),
        }

        provider = providers.get(name)
        if not provider:
            raise ValueError(f"Unknown provider: {name}")
        return provider

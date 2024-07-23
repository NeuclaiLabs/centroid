from litellm import completion

from openastra.core.logger import logger
from openastra.tools.base import BaseTool
from openastra.tools.web_search.manager import SearchProviderFactory
from openastra.tools.web_search.models import SearchConfig, SearchContext


class WebSearchAction(BaseTool):
    _name = "web_search"

    def __init__(self, config: SearchConfig):
        super().__init__(self._name, SearchConfig(**config[self._name]))
        self.search_provider = SearchProviderFactory.get(self.config)

    def run(self, context: SearchContext):
        if context.kind == "search":
            try:
                # STEP 1: perform web search on query
                # STEP 2: get results
                # STEP 3: Summarize the results and return the summary

                response = completion(
                    model=self.payload.llm or "ollama/mistral",
                    messages=[
                        {
                            "content": self.payload["description"],
                            "role": "user",
                        }
                    ],
                    api_base="http://localhost:11434",
                    stream=False,
                )
                logger.info(response)
            except Exception as e:
                logger.exception(e)


if __name__ == "__main__":
    web_search = WebSearchAction(
        payload={
            "description": "who won India vs Australia match yesterday?",
            "args": {},
        },
        config={"general": {}, "web_search": {}},
    )
    web_search.execute()

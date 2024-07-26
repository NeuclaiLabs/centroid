from litellm import completion

from openastra.core.logger import logger

from .models import BaseToolConfig, BaseToolContext


class Runner:
    def run(self, context: BaseToolContext, config: BaseToolConfig):
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

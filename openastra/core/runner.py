from litellm import completion

from openastra.core.logger import logger

from .models import BaseConfig, BaseContext


class Runner:
    def run(self, context: BaseContext, config: BaseConfig):
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

from litellm import completion


class LLMChatClient:
    def __init__(self, config, context):
        self.model: str = context.get("model")
        self.api_key: str = [
            llm for llm in config.get("llm") if llm.get("name") == self.model
        ][0].get("api_key")

    def get_chat_response(self, messages: list = None, **kwargs):
        return completion(
            model=self.model,
            api_key=self.api_key,
            messages=messages or [{"content": "Hello, how are you?", "role": "user"}],
            **kwargs,
        )


# Example usage:
if __name__ == "__main__":
    # OpenAI GPT-3.5
    config = {
        "llm": [
            {
                "name": "gpt-3.5-turbo",
                "api_key": "sk-proj-eXrQS0396lcpeLw9SeYFT3BlbkFJi3KJa72kdsyXcurQ3AHm",
            }
        ]
    }
    context = {"model": "gpt-3.5-turbo"}
    print(LLMChatClient(config, context).get_chat_response())

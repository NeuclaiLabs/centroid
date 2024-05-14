import json
import logging
import os

from dotenv import load_dotenv
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel

router = APIRouter()
load_dotenv()

tools = [
    {
        "name": "showStockPrice",
        "description": "Get the current stock price of a given stock or currency. Use this to show the price to the user.",
        "parameters": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.",
                },
                "price": {"type": "number", "description": "The price of the stock."},
                "delta": {
                    "type": "number",
                    "description": "The change in price of the stock",
                },
            },
            "required": ["symbol", "price", "delta"],
        },
    },
    {
        "name": "listStocks",
        "description": "List three imaginary stocks that are trending.",
        "parameters": {
            "type": "object",
            "properties": {
                "stocks": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "symbol": {
                                "type": "string",
                                "description": "The symbol of the stock",
                            },
                            "price": {
                                "type": "number",
                                "description": "The price of the stock",
                            },
                            "delta": {
                                "type": "number",
                                "description": "The change in price of the stock",
                            },
                        },
                        "required": ["symbol", "price", "delta"],
                    },
                }
            },
            "required": ["stocks"],
        },
    },
    {
        "name": "showStockPurchase",
        "description": "Show price and the UI to purchase a stock or currency. Use this if the user wants to purchase a stock or currency.",
        "parameters": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.",
                },
                "price": {"type": "number", "description": "The price of the stock."},
                "numberOfShares": {
                    "type": "number",
                    "description": "The number of shares for a stock or currency to purchase. Can be optional if the user did not specify it.",
                },
            },
            "required": ["symbol", "price"],
        },
    },
    {
        "name": "getEvents",
        "description": "List funny imaginary events between user highlighted dates that describe stock activity.",
        "parameters": {
            "type": "object",
            "properties": {
                "events": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "date": {
                                "type": "string",
                                "description": "The date of the event, in ISO-8601 format",
                            },
                            "headline": {
                                "type": "string",
                                "description": "The headline of the event",
                            },
                            "description": {
                                "type": "string",
                                "description": "The description of the event",
                            },
                        },
                        "required": ["date", "headline", "description"],
                    },
                }
            },
            "required": ["events"],
        },
    },
]


DEFAULT_SYSTEM_TEMPLATE = """You have access to the following tools:

{tools}

You either can respond conversationally without talking referring anything about tools or you can select one of the
above tools and respond with only a JSON object matching the following schema:

{{
  "tool": <name of the selected tool>,
  "input": <parameters for the selected tool, matching the tool's JSON schema>
}}
"""


class LogitBias(BaseModel):
    """Represents the logit bias for a token."""

    token_id: int
    bias: float


class ChatCompletionRequest(BaseModel):
    """Represents the request body for creating a chat completion."""

    model: str = "mistral:instruct"
    stream: bool | None = True
    messages: list[dict] | None = None
    frequency_penalty: float | None = None
    logit_bias: list[LogitBias] | None = None
    logprobs: bool | None = None
    top_logprobs: int | None = None
    max_tokens: int | None = None
    n: int | None = None
    presence_penalty: float | None = None
    response_format: dict | None = None
    seed: int | None = None
    stop: str | list[str] | None = None
    temperature: float | None = None
    top_p: float | None = None
    tools: list[dict] | None = None
    tool_choice: str | dict | None = None

    def dict(self, *args, **kwargs):
        filtered_dict = super().dict(*args, **kwargs)
        return {key: value for key, value in filtered_dict.items() if value is not None}


class ChoiceDelta(BaseModel):
    content: str
    function_call: dict | None
    role: str
    tool_calls: list | None


class Choice(BaseModel):
    delta: ChoiceDelta
    finish_reason: str | None
    index: int
    logprobs: dict | None


class ChatCompletionChunk(BaseModel):
    id: str
    choices: list[Choice]
    created: int
    model: str
    object: str
    system_fingerprint: str

    def __iter__(self):
        for field in self.__fields__:
            yield field, getattr(self, field)

    def __getitem__(self, key):
        return getattr(self, key)


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


client = AsyncOpenAI(
    base_url="https://api.openai.com/v1",
    api_key=os.environ.get("OPENAI_API_KEY"),  # required, but unused
)


@router.post("/chat/completions")
async def create_chat_completion(chat: ChatCompletionRequest) -> ChatCompletionChunk:
    async def response_stream():
        is_tool_invocation = None
        chat.messages = [
            {
                "role": "system",
                "content": DEFAULT_SYSTEM_TEMPLATE.format(
                    tools=json.dumps(tools, indent=2)
                ),
            }
        ] + chat.messages
        chat_coroutine = client.chat.completions.create(**chat.dict())
        events = []
        async for event in await chat_coroutine:
            events.append(event)
            is_tool_invocation = (
                event.choices[0].delta.content.strip().startswith("{")
                if is_tool_invocation is None
                else is_tool_invocation
            )
            if is_tool_invocation:
                pass
            else:
                yield (
                    "data: "
                    + json.dumps(event.model_dump(), ensure_ascii=False)
                    + "\n\n"
                )

        print(
            "Is tool invocation",
            event.choices[0],
            is_tool_invocation,
            "".join([event.choices[0].delta.content for event in events]),
        )

        if is_tool_invocation:
            tools_detected = json.loads(
                "".join([event.choices[0].delta.content for event in events])
            )
            # Yielding name
            events[-1].choices[0].delta.tool_calls = [
                {
                    "index": 0,
                    "function": {
                        "name": tools_detected["tool"],
                        "arguments": None,
                    },
                }
            ]
            yield ("data: " + json.dumps(events[-1].model_dump()) + "\n\n")

            # Yielding arguments
            events[-1].choices[0].delta.tool_calls = [
                {
                    "index": 0,
                    "function": {
                        "name": None,
                        "arguments": json.dumps(tools_detected["input"]),
                    },
                }
            ]
            yield ("data: " + json.dumps(events[-1].model_dump()) + "\n\n")

            # Yielding final chunk
            events[-1].choices[0].delta = {}
            events[-1].choices[0].finish_reason = "tool_calls"
            yield ("data: " + json.dumps(events[-1].model_dump()) + "\n\n")

    return StreamingResponse(response_stream(), media_type="text/event-stream")

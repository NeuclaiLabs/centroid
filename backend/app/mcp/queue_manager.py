import asyncio
import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Any

from redis.asyncio import Redis

from app.core.config import settings

logger = logging.getLogger(__name__)


class ToolCallRequest:
    def __init__(
        self,
        request_id: str,
        proxy_id: str,
        tool_name: str,
        arguments: dict[str, Any],
        timeout: int = 300,
    ):
        self.request_id = request_id
        self.proxy_id = proxy_id
        self.tool_name = tool_name
        self.arguments = arguments
        self.timeout = timeout
        self.created_at = datetime.utcnow()
        self.expires_at = self.created_at + timedelta(seconds=timeout)

    def to_dict(self) -> dict[str, Any]:
        return {
            "request_id": self.request_id,
            "proxy_id": self.proxy_id,
            "tool_name": self.tool_name,
            "arguments": self.arguments,
            "timeout": self.timeout,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ToolCallRequest":
        request = cls(
            request_id=data["request_id"],
            proxy_id=data["proxy_id"],
            tool_name=data["tool_name"],
            arguments=data["arguments"],
            timeout=data["timeout"],
        )
        request.created_at = datetime.fromisoformat(data["created_at"])
        request.expires_at = datetime.fromisoformat(data["expires_at"])
        return request


class RedisQueueManager:
    def __init__(self):
        self.redis: Redis | None = None
        self.pubsub: Redis | None = None
        self._running = False
        self._worker_task: asyncio.Task | None = None
        self._response_handlers: dict[str, asyncio.Future] = {}

        # Queue names
        self.tool_queue = "mcp:tool_calls"
        self.response_channel = "mcp:responses"
        self.result_key_prefix = "mcp:result:"

    async def connect(self) -> None:
        try:
            self.redis = Redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
                retry_on_timeout=True,
                health_check_interval=30,
            )

            # Test connection
            await self.redis.ping()
            logger.info(f"Connected to Redis at {settings.redis_url}")

            # Set up pub/sub for response handling
            self.pubsub = self.redis.pubsub()
            await self.pubsub.subscribe(self.response_channel)

        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def disconnect(self) -> None:
        if self._worker_task and not self._worker_task.done():
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass

        if self.pubsub:
            await self.pubsub.unsubscribe(self.response_channel)
            await self.pubsub.close()

        if self.redis:
            await self.redis.close()

        logger.info("Disconnected from Redis")

    async def enqueue_tool_call(
        self,
        proxy_id: str,
        tool_name: str,
        arguments: dict[str, Any],
        timeout: int = 300,
    ) -> str:
        if not self.redis:
            raise RuntimeError("Redis not connected")

        request_id = str(uuid.uuid4())
        request = ToolCallRequest(
            request_id=request_id,
            proxy_id=proxy_id,
            tool_name=tool_name,
            arguments=arguments,
            timeout=timeout,
        )

        # Add to queue
        await self.redis.lpush(self.tool_queue, json.dumps(request.to_dict()))

        logger.debug(f"Enqueued tool call {request_id} for proxy {proxy_id}")
        return request_id

    async def wait_for_result(self, request_id: str, timeout: int = 300) -> Any:
        if not self.redis:
            raise RuntimeError("Redis not connected")

        # Create a future for this request
        future = asyncio.Future()
        self._response_handlers[request_id] = future

        try:
            # Wait for the result with timeout
            result = await asyncio.wait_for(future, timeout=timeout)
            return result
        except asyncio.TimeoutError:
            logger.warning(f"Tool call {request_id} timed out after {timeout}s")
            return []
        finally:
            # Clean up
            self._response_handlers.pop(request_id, None)

    async def _handle_response_message(self, message: dict[str, Any]) -> None:
        if message["type"] != "message":
            return

        try:
            data = json.loads(message["data"])
            request_id = data.get("request_id")

            if request_id in self._response_handlers:
                future = self._response_handlers[request_id]
                if not future.done():
                    if "error" in data:
                        future.set_exception(Exception(data["error"]))
                    else:
                        future.set_result(data.get("result", []))

        except Exception as e:
            logger.error(f"Error handling response message: {e}")

    async def start_response_listener(self) -> None:
        if not self.pubsub:
            raise RuntimeError("PubSub not initialized")

        logger.info("Starting response listener")

        async for message in self.pubsub.listen():
            await self._handle_response_message(message)

    async def process_tool_calls(self, proxy_manager: dict[str, Any]) -> None:
        if not self.redis:
            raise RuntimeError("Redis not connected")

        logger.info("Starting tool call processor")

        while self._running:
            try:
                # Block and wait for a tool call request
                result = await self.redis.brpop(self.tool_queue, timeout=1)

                if not result:
                    continue

                _, message_data = result
                request_data = json.loads(message_data)
                request = ToolCallRequest.from_dict(request_data)

                # Check if request has expired
                if datetime.utcnow() > request.expires_at:
                    logger.warning(f"Tool call {request.request_id} expired, skipping")
                    continue

                # Process the tool call
                await self._process_single_tool_call(request, proxy_manager)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error processing tool calls: {e}")
                await asyncio.sleep(1)

    async def _process_single_tool_call(
        self, request: ToolCallRequest, proxy_manager: dict[str, Any]
    ) -> None:
        try:
            # Get the proxy from the manager
            proxy = proxy_manager.get(request.proxy_id)
            if not proxy:
                raise Exception(f"Proxy {request.proxy_id} not found")

            # Execute the tool call directly on the client
            if not proxy.client or not proxy.client.is_connected():
                raise Exception(f"Proxy {request.proxy_id} client not connected")

            result = await proxy.client.call_tool(request.tool_name, request.arguments)

            # Publish the result
            response = {
                "request_id": request.request_id,
                "result": result,
                "success": True,
            }

        except Exception as e:
            logger.error(f"Error executing tool call {request.request_id}: {e}")
            response = {
                "request_id": request.request_id,
                "error": str(e),
                "success": False,
                "result": [],
            }

        # Publish response
        await self.redis.publish(self.response_channel, json.dumps(response))

    async def start_worker(self, proxy_manager: dict[str, Any]) -> None:
        self._running = True

        # Start both the response listener and tool call processor
        await asyncio.gather(
            self.start_response_listener(),
            self.process_tool_calls(proxy_manager),
        )

    async def stop_worker(self) -> None:
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass


# Global queue manager instance
queue_manager = RedisQueueManager()

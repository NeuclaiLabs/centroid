from typing import Any

from amplitude import Amplitude, BaseEvent
from fastapi import Request

from app.core.config import settings


class AnalyticsService:
    def __init__(self):
        self.client = None
        if settings.TELEMETRY_ENABLED and settings.AMPLITUDE_API_KEY:
            self.client = Amplitude(settings.AMPLITUDE_API_KEY)

    def should_track_request(self, request: Request) -> bool:
        """Determine if the request should be tracked"""
        return request.url.path.startswith("/api/v1/chats") and request.method in [
            "POST",
            "PUT",
            "DELETE",
        ]

    def track_api_event(
        self,
        request: Request,
        response_status: int,
        duration_ms: int,
        user_id: str | None = None,
        additional_properties: dict[Any, Any] = None,
    ):
        # Skip if telemetry is disabled or client isn't initialized
        if not self.client or not settings.TELEMETRY_ENABLED:
            return

        # Skip if not a trackable request
        if not self.should_track_request(request):
            return

        category = "chat"
        # Build event name: category_action (e.g., chats_create)
        event_name = f"{category}_{self._get_action_from_method(request.method, request.url.path)}"

        # Base properties that should be tracked for all events
        properties = {
            "path": request.url.path,
            "method": request.method,
            "status_code": response_status,
            "duration_ms": duration_ms,
            "slow_request": duration_ms > 1000,
            "user_agent": request.headers.get("user-agent"),
            "referer": request.headers.get("referer"),
            "category": category,
        }

        # Add any additional properties
        if additional_properties:
            properties.update(additional_properties)

        event = BaseEvent(
            event_type=event_name, user_id=user_id, event_properties=properties
        )
        try:
            self.client.track(event)
        except Exception as e:
            print("Error tracking event", e)

    def _get_action_from_method(self, method: str, path: str) -> str:
        """Determine the action based on HTTP method and path"""
        if method == "GET":
            return "list" if path.count("/") == 1 else "view"
        elif method == "POST":
            return "create"
        elif method == "PUT" or method == "PATCH":
            return "update"
        elif method == "DELETE":
            return "delete"
        return "other"

from app.mcp.openapi.schema_to_func import schema_to_function
from app.mcp.server import deregister_tool, register_tool
from app.models.tool_instance import ToolInstanceStatus


class ToolRegistrationService:
    """Service for managing tool registration lifecycle."""

    @staticmethod
    def sync_registration_state(
        status: ToolInstanceStatus,
        old_status: ToolInstanceStatus | None,
        tool_schema: dict,
        tool_metadata: dict,
        tool_config: dict,
    ) -> None:
        """
        Synchronize the tool's registration state with its status.

        Args:
            status: Current status of the tool instance
            old_status: Previous status of the tool instance (None for new instances)
            tool_schema: OpenAPI schema of the tool
            tool_metadata: Additional metadata for the tool
            tool_config: Additional config for the tool
        """
        is_new_instance = old_status is None
        is_status_change = not is_new_instance and old_status != status

        # For new instances, register only if active
        if is_new_instance:
            if status == ToolInstanceStatus.ACTIVE:
                register_tool(
                    schema_to_function(tool_schema, tool_metadata, tool_config)
                )
            return

        # For existing instances, handle status changes
        if is_status_change:
            if status == ToolInstanceStatus.ACTIVE:
                register_tool(
                    schema_to_function(tool_schema, tool_metadata, tool_config)
                )
            elif status == ToolInstanceStatus.INACTIVE:
                deregister_tool(tool_schema["name"])

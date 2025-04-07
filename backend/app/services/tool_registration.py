import logging

from sqlmodel import Session, select

from app.mcp.openapi.schema_to_func import schema_to_function
from app.mcp.server import deregister_tool, register_tool
from app.models import ToolInstance
from app.models.tool_instance import ToolInstanceStatus

logger = logging.getLogger(__name__)


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

    @staticmethod
    def load_active_tool_instances(session: Session) -> None:
        """
        Load and register all active tool instances at server startup.

        This method should be called during server initialization to ensure
        all active tool instances are properly registered with the MCP server.

        Args:
            session: Database session for querying tool instances
        """
        # Query all active tool instances with their related definitions
        active_instances = session.exec(
            select(ToolInstance)
            .where(ToolInstance.status == ToolInstanceStatus.ACTIVE)
            .join(ToolInstance.definition)
        ).all()

        # Register each active instance
        total_registered = 0
        for instance in active_instances:
            try:
                tool_name = instance.definition.tool_schema.get("name", "unknown")
                logger.info(
                    f"Registering active tool instance: {tool_name} (ID: {instance.id})"
                )
                register_tool(
                    schema_to_function(
                        instance.definition.tool_schema,
                        instance.definition.tool_metadata,
                        instance.config or {},
                    )
                )
                total_registered += 1
            except Exception as e:
                logger.error(
                    f"Failed to register tool instance {instance.id}: {str(e)}"
                )

        logger.info(
            f"Completed tool instance registration. Total registered: {total_registered}"
        )

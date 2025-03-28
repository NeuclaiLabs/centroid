from humps import camelize, decamelize
from pydantic import BaseModel, ConfigDict


class CamelModel(BaseModel):
    """Base model for all API models with camel case conversion for keys only"""

    model_config = ConfigDict(
        alias_generator=lambda x: camelize(x),  # Only transform field names
        populate_by_name=True,
        from_attributes=True,
    )

    # Convert snake_case to camelCase in response
    def model_dump(self, *args, **kwargs):
        # Ensure camelCase keys in response
        kwargs.setdefault("by_alias", True)
        return super().model_dump(*args, **kwargs)

    # Convert camelCase to snake_case in request
    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        # Convert incoming camelCase keys to snake_case
        if isinstance(obj, dict):
            obj = {decamelize(k): v for k, v in obj.items()}
        return super().model_validate(obj, *args, **kwargs)

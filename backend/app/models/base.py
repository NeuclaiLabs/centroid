from humps import camelize
from pydantic import BaseModel, ConfigDict


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=camelize, populate_by_name=True)

    def dict(self, *args, **kwargs):
        kwargs.setdefault("by_alias", True)
        return super().dict(*args, **kwargs)

    def json(self, *args, **kwargs):
        kwargs.setdefault("by_alias", True)
        return super().json(*args, **kwargs)

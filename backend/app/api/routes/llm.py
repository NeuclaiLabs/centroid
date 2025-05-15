import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, computed_field

from app.core.config import settings

router = APIRouter()


class ModelInfo(BaseModel):
    id: str
    name: str | None = None
    object: str | None = None
    created: int | None = None
    owned_by: str | None = None

    @computed_field
    def label(self) -> str:
        """Returns a user-friendly label for the model"""
        # Use name if available, otherwise format the id
        if self.name:
            return self.name
        return self.id.replace("-", " ").title()

    @computed_field
    def is_default(self) -> bool:
        """Returns whether this is the default model"""
        return self.id == settings.LLM_DEFAULT_MODEL


class ModelsResponse(BaseModel):
    object: str | None = None  # Added to match API response
    data: list[ModelInfo]


@router.get("/models", response_model=ModelsResponse)
async def get_models():
    """
    Fetch available models from the LLM service
    """
    try:
        headers = {"Authorization": f"Bearer {settings.LLM_API_KEY}"}
        # Ensure the base URL doesn't end with a slash and append v1/models
        models_url = f"{settings.LLM_BASE_URL.rstrip('/')}/models"

        async with httpx.AsyncClient() as client:
            response = await client.get(models_url, headers=headers)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch models from LLM service: {str(e)}"
        )

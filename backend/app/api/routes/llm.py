import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, computed_field

from app.core.config import settings

router = APIRouter()


class ModelInfo(BaseModel):
    id: str
    object: str
    created: int
    owned_by: str

    @computed_field
    def label(self) -> str:
        """Returns a user-friendly label for the model"""
        # Remove tags after ':' if they exist
        base_name = self.id.split(":")[0]
        # Replace separators with spaces and capitalize each word
        return base_name.replace("-", " ").title()


class ModelsResponse(BaseModel):
    object: str
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
        print(e)
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch models from LLM service: {str(e)}"
        )

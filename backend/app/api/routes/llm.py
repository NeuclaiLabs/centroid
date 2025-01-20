from urllib.parse import urljoin

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
        headers = {}
        if settings.LLM_API_KEY:
            headers["Authorization"] = f"Bearer {settings.LLM_API_KEY}"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                urljoin(settings.LLM_BASE_URL, "models"), headers=headers
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch models from LLM service: {str(e)}"
        )

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.core.logger import get_logger
from app.models import (
    Secret,
    SecretCreate,
    SecretOut,
    SecretSearch,
    SecretsOut,
    SecretUpdate,
    SecretWithValueOut,
    UtilsMessage,
)

router = APIRouter()
logger = get_logger(__name__, service="secrets")


def get_secret(
    session: SessionDep, secret_id: str, current_user: CurrentUser
) -> Secret:
    """Get a secret by ID or raise 404."""
    secret = session.get(Secret, secret_id)
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Secret not found"
        )
    if not current_user.is_superuser and (secret.owner_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    return secret


@router.get("/", response_model=SecretsOut)
def read_secrets(
    session: SessionDep,
    current_user: CurrentUser,
    search: SecretSearch = Depends(),
    skip: int = 0,
    limit: int = 100,
) -> SecretsOut:
    """Retrieve secrets with pagination."""
    try:
        # Build base query with owner filter
        statement = select(Secret).where(Secret.owner_id == current_user.id)

        # Add environment filter if provided
        if search.environment:
            statement = statement.where(Secret.environment == search.environment)

        # Get total count
        count = session.exec(
            select(func.count()).select_from(statement.subquery())
        ).one()

        # Get paginated results
        secrets = session.exec(statement.offset(skip).limit(limit)).all()

        # Convert to output models
        secrets_out = [SecretOut.model_validate(secret) for secret in secrets]

        return SecretsOut(data=secrets_out, count=count)
    except Exception as e:
        logger.error(f"Failed to fetch secrets: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch secrets: {str(e)}",
        )


@router.post("/", response_model=SecretOut)
def create_secret(
    session: SessionDep,
    secret_in: SecretCreate,
    current_user: CurrentUser,
) -> SecretOut:
    """Create new secret."""
    try:
        # Check if secret with same name already exists for this user
        existing_secret = session.exec(
            select(Secret).where(
                Secret.name == secret_in.name, Secret.owner_id == current_user.id
            )
        ).first()
        if existing_secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A secret with this name already exists.",
            )

        print(f"Secret in: {secret_in}")
        # Create secret using the same pattern as Connection
        secret = Secret.model_validate(secret_in)
        secret.owner_id = current_user.id
        if secret_in.value is not None:
            secret.value = secret_in.value
        print(f"Secret: {secret}")

        session.add(secret)
        session.commit()
        session.refresh(secret)

        return SecretOut.model_validate(secret)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create secret: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create secret: {str(e)}",
        )


@router.get("/{secret_id}", response_model=SecretWithValueOut)
def read_secret(
    session: SessionDep,
    secret_id: str,
    current_user: CurrentUser,
) -> SecretWithValueOut:
    """Get secret by ID."""
    try:
        secret = get_secret(session, secret_id, current_user)
        logger.info(f"Secret: {secret}")
        return SecretWithValueOut.model_validate(secret)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch secret {secret_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch secret: {str(e)}",
        )


@router.put("/{secret_id}", response_model=SecretOut)
def update_secret(
    session: SessionDep,
    secret_id: str,
    secret_in: SecretUpdate,
    current_user: CurrentUser,
) -> SecretOut:
    """Update a secret."""
    try:
        secret = get_secret(session, secret_id, current_user)

        # Only update fields that were actually provided
        update_data = secret_in.model_dump(exclude_unset=True, by_alias=False)

        # Handle value separately
        value = update_data.pop("value", None)
        if value is not None:
            secret.value = value

        # If name is being updated, check for duplicates
        if "name" in update_data and update_data["name"] != secret.name:
            existing_secret = session.exec(
                select(Secret).where(
                    Secret.name == update_data["name"],
                    Secret.owner_id == current_user.id,
                    Secret.id != secret_id,
                )
            ).first()
            if existing_secret:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A secret with this name already exists.",
                )

        # Update other fields
        for field, value in update_data.items():
            setattr(secret, field, value)

        session.add(secret)
        session.commit()
        session.refresh(secret)

        return SecretOut.model_validate(secret)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update secret {secret_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update secret: {str(e)}",
        )


@router.delete(
    "/{secret_id}",
    response_model=UtilsMessage,
    status_code=status.HTTP_200_OK,
)
def delete_secret(
    session: SessionDep,
    secret_id: str,
    current_user: CurrentUser,
) -> UtilsMessage:
    """Delete a secret."""
    try:
        secret = get_secret(session, secret_id, current_user)
        session.delete(secret)
        session.commit()
        return UtilsMessage(message="Secret deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete secret {secret_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete secret: {str(e)}",
        )

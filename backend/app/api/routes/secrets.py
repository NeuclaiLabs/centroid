"""Routes for secrets."""

from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.core.logger import get_logger
from app.models import (
    Secret,
    SecretCreate,
    SecretOut,
    SecretsOut,
    SecretUpdate,
    UtilsMessage,
)

logger = get_logger(__name__)

router = APIRouter()


@router.get("/", response_model=SecretsOut)
def read_secrets(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve secrets owned by the current user.
    All search parameters are optional and will be automatically parsed from query parameters.
    """
    # Build base query - users can only access their own secrets
    query = select(Secret).where(Secret.owner_id == current_user.id)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count = session.exec(count_query).one()

    # Get paginated results
    query = query.offset(skip).limit(limit)
    secrets = session.exec(query).all()

    # Create SecretOut objects with decrypted values
    secret_outs = []
    for secret in secrets:
        secret_out = SecretOut.model_validate(secret)
        secret_out.value = secret.value  # This will use the property to decrypt
        secret_outs.append(secret_out)

    return SecretsOut(
        data=secret_outs,
        count=count,
    )


@router.get("/{id}", response_model=SecretOut)
def read_secret(
    session: SessionDep,
    current_user: CurrentUser,
    id: str,
) -> Any:
    """
    Get secret by ID (only if owned by current user).
    """
    db_secret = session.get(Secret, id)

    if not db_secret:
        raise HTTPException(status_code=404, detail="Secret not found")

    if db_secret.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    secret_out = SecretOut.model_validate(db_secret)
    secret_out.value = db_secret.value  # Include decrypted value
    return secret_out


@router.post("/", response_model=SecretOut)
def create_or_update_secret(
    session: SessionDep,
    current_user: CurrentUser,
    secret_in: SecretCreate,
) -> Any:
    """
    Create or update a secret.
    """
    # If ID is provided, check if secret already exists
    existing_secret = None
    if secret_in.id:
        existing_secret = session.get(Secret, secret_in.id)

    # If the secret doesn't exist, create a new one
    if not existing_secret:
        # Create new secret with owner
        secret_dict = secret_in.model_dump()
        secret_dict["owner_id"] = str(current_user.id)

        # If no ID provided, nanoid will generate one automatically
        if not secret_dict.get("id"):
            secret_dict.pop("id", None)  # Remove None id to let nanoid generate

        db_secret = Secret.model_validate(secret_dict)

        # Set the value (this will automatically encrypt it)
        db_secret.value = secret_in.value

        # Save to database
        session.add(db_secret)
        session.commit()
        session.refresh(db_secret)

        # Return with decrypted value
        secret_out = SecretOut.model_validate(db_secret)
        secret_out.value = db_secret.value
        return secret_out

    # Otherwise, update the existing secret
    if existing_secret.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Update the existing secret
    update_dict = secret_in.model_dump(exclude_unset=True, exclude={"id"})

    # Handle value field separately for encryption
    if "value" in update_dict:
        value = update_dict.pop("value")
        existing_secret.value = value

    # Update other fields
    if update_dict:
        existing_secret.sqlmodel_update(update_dict)

    # Commit changes to database
    session.add(existing_secret)
    session.commit()
    session.refresh(existing_secret)

    secret_out = SecretOut.model_validate(existing_secret)
    secret_out.value = existing_secret.value
    return secret_out


@router.put("/{id}", response_model=SecretOut)
def update_secret(
    session: SessionDep,
    current_user: CurrentUser,
    id: str,
    secret_in: SecretUpdate,
) -> Any:
    """
    Update a secret (only if owned by current user).
    """
    # Get the database instance
    db_secret = session.get(Secret, id)
    if not db_secret:
        raise HTTPException(status_code=404, detail="Secret not found")

    if db_secret.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Only update the fields that were provided
    update_dict = secret_in.model_dump(exclude_unset=True)

    # Handle value field separately for encryption
    if "value" in update_dict:
        value = update_dict.pop("value")
        db_secret.value = value

    # Update other fields
    if update_dict:
        db_secret.sqlmodel_update(update_dict)

    # Commit changes to database
    session.add(db_secret)
    session.commit()
    session.refresh(db_secret)

    secret_out = SecretOut.model_validate(db_secret)
    secret_out.value = db_secret.value  # Include decrypted value
    return secret_out


@router.delete("/{id}", response_model=UtilsMessage)
def delete_secret(
    session: SessionDep,
    current_user: CurrentUser,
    id: str,
) -> Any:
    """
    Delete a secret (only if owned by current user).
    """
    # Get the database instance
    db_secret = session.get(Secret, id)
    if not db_secret:
        raise HTTPException(status_code=404, detail="Secret not found")

    if db_secret.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Delete from database
    session.delete(db_secret)
    session.commit()

    return UtilsMessage(message="Secret deleted successfully")

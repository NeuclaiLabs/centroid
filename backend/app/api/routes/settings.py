from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    Setting,
    SettingCreate,
    SettingOut,
    SettingsOut,
    SettingUpdate,
)

router = APIRouter()


@router.get("/", response_model=SettingsOut)
def read_settings(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """Retrieve Settings."""
    statement = (
        select(func.count())
        .select_from(Setting)
        .where(Setting.owner_id == current_user.id)
    )
    count = session.exec(statement).one()
    statement = (
        select(Setting)
        .where(Setting.owner_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    settings = session.exec(statement).all()
    return SettingsOut(data=settings, count=count)


@router.get("/{id}", response_model=SettingOut)
def read_setting(session: SessionDep, current_user: CurrentUser, id: str) -> Any:
    """Get setting by ID."""
    setting = session.get(Setting, id)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    if not current_user.is_superuser and (setting.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return setting


@router.post("/", response_model=SettingOut)
def create_setting(
    *, session: SessionDep, current_user: CurrentUser, setting_in: SettingCreate
) -> Any:
    """Create new setting."""
    setting = Setting.model_validate(setting_in, update={"owner_id": current_user.id})
    session.add(setting)
    session.commit()
    session.refresh(setting)
    return setting


@router.put("/{id}", response_model=SettingOut)
def update_setting(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: str,
    setting_in: SettingUpdate,
) -> Any:
    """Update a setting."""
    setting = session.get(Setting, id)
    if not setting:
        raise HTTPException(status_code=404, detail="setting not found")
    if not current_user.is_superuser and (setting.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = setting_in.model_dump(exclude_unset=True)
    setting.sqlmodel_update(update_dict)
    session.add(setting)
    session.commit()
    session.refresh(setting)
    return setting


@router.delete("/{id}")
def delete_setting(session: SessionDep, current_user: CurrentUser, id: str) -> Message:
    """Delete a setting."""
    setting = session.get(Setting, id)
    if not setting:
        raise HTTPException(status_code=404, detail="setting not found")
    if not current_user.is_superuser and (setting.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(setting)
    session.commit()
    return Message(message="setting deleted successfully")

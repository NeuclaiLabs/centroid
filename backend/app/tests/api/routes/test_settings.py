from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.tests.utils.setting import create_random_setting


def test_create_setting(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"data": {"key": "value"}}
    response = client.post(
        f"{settings.API_V1_STR}/settings/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["data"] == data["data"]
    assert "id" in content
    assert "owner_id" in content


def test_read_setting(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    setting = create_random_setting(db)
    response = client.get(
        f"{settings.API_V1_STR}/settings/{setting.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["data"] == setting.data
    assert content["id"] == setting.id
    assert content["owner_id"] == setting.owner_id


def test_read_setting_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/settings/999",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Setting not found"


def test_read_setting_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    setting = create_random_setting(db)
    response = client.get(
        f"{settings.API_V1_STR}/settings/{setting.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 400
    content = response.json()
    assert content["detail"] == "Not enough permissions"


def test_read_settings(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_random_setting(db)
    create_random_setting(db)
    response = client.get(
        f"{settings.API_V1_STR}/settings/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2


def test_update_setting(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    setting = create_random_setting(db)
    data = {"data": {"new_key": "new_value"}}
    response = client.put(
        f"{settings.API_V1_STR}/settings/{setting.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["data"] == data["data"]
    assert content["id"] == setting.id
    assert content["owner_id"] == setting.owner_id


def test_update_setting_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"data": {"new_key": "new_value"}}
    response = client.put(
        f"{settings.API_V1_STR}/settings/999",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "setting not found"


def test_update_setting_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    setting = create_random_setting(db)
    data = {"data": {"new_key": "new_value"}}
    response = client.put(
        f"{settings.API_V1_STR}/settings/{setting.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 400
    content = response.json()
    assert content["detail"] == "Not enough permissions"


def test_delete_setting(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    setting = create_random_setting(db)
    response = client.delete(
        f"{settings.API_V1_STR}/settings/{setting.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "setting deleted successfully"


def test_delete_setting_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_V1_STR}/settings/999",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "setting not found"


def test_delete_setting_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    setting = create_random_setting(db)
    response = client.delete(
        f"{settings.API_V1_STR}/settings/{setting.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 400
    content = response.json()
    assert content["detail"] == "Not enough permissions"

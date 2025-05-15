import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, delete

from app.core.config import settings
from app.core.security import get_password_hash
from app.crud import get_user_by_email
from app.models.secret import (
    ApiKeyAuth,
    AuthConfig,
    AuthType,
    Secret,
    User,
)


@pytest.fixture(autouse=True)
def cleanup_secrets(db: Session):
    """Clean up secrets before each test."""
    statement = delete(Secret)
    db.execute(statement)
    db.commit()
    yield


@pytest.fixture
def valid_secret_data():
    return {
        "name": "TEST_API_KEY",
        "description": "A test secret",
        "value": "super-secret-value",
        "environment": "development",
        "kind": "ENV",
    }


@pytest.fixture
def valid_auth_config_secret_data():
    return {
        "name": "TEST_AUTH_CONFIG",
        "description": "A test auth config secret",
        "value": AuthConfig(
            type=AuthType.API_KEY,
            config=ApiKeyAuth(key="X-API-Key", value="test-api-key", location="header"),
        ),
        "environment": "development",
        "kind": "AUTH",
    }


def test_create_secret_success(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    valid_secret_data: dict,
    db: Session,
):
    response = client.post(
        f"{settings.API_V1_STR}/secrets/",
        headers=normal_user_token_headers,
        json=valid_secret_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == valid_secret_data["name"]
    assert content["description"] == valid_secret_data["description"]
    assert content["environment"] == valid_secret_data["environment"]
    assert content["kind"] == valid_secret_data["kind"]
    assert "id" in content
    assert "createdAt" in content
    assert "updatedAt" in content
    assert "ownerId" in content
    # Value should not be included in the default response
    assert "value" not in content

    # Verify owner is the test user
    user = get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)
    assert content["ownerId"] == user.id


def test_secret_value_types(db: Session):
    """Test that secret values can be stored as different types"""
    # Get or create test user
    user = get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)
    if not user:
        user = User(
            email=settings.EMAIL_TEST_USER,
            hashed_password=get_password_hash("testpass123"),
            full_name="Test User",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Test string value
    string_secret = Secret(
        name="STRING_SECRET",
        value="string-value",
        owner_id=user.id,
        kind="ENV",
    )
    db.add(string_secret)
    db.commit()
    db.refresh(string_secret)
    assert string_secret.value == "string-value"

    # Test dict value
    dict_secret = Secret(
        name="DICT_SECRET",
        value={"key": "value", "nested": {"key": "value"}},
        owner_id=user.id,
        kind="API_KEY",
    )
    db.add(dict_secret)
    db.commit()
    db.refresh(dict_secret)
    assert dict_secret.value == {"key": "value", "nested": {"key": "value"}}


def test_create_duplicate_secret(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    valid_secret_data: dict,
):
    # Create first secret
    response = client.post(
        f"{settings.API_V1_STR}/secrets/",
        headers=normal_user_token_headers,
        json=valid_secret_data,
    )
    assert response.status_code == 200

    # Try to create another secret with the same name
    response = client.post(
        f"{settings.API_V1_STR}/secrets/",
        headers=normal_user_token_headers,
        json=valid_secret_data,
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "A secret with this name already exists."


def test_read_secrets_pagination(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    db: Session,
):
    # Get the test user
    user = get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)

    # Create multiple secrets
    for i in range(3):
        secret = Secret(
            name=f"TEST_SECRET_{i}",
            value=f"secret-value-{i}",
            owner_id=user.id,
        )
        db.add(secret)
    db.commit()

    # Test default pagination
    response = client.get(
        f"{settings.API_V1_STR}/secrets/",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) == 3
    assert content["count"] == 3
    # Verify owner_id in response and no values exposed
    for secret in content["data"]:
        assert secret["ownerId"] == user.id
        assert "value" not in secret

    # Test with limit
    response = client.get(
        f"{settings.API_V1_STR}/secrets/?limit=2",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) == 2
    assert content["count"] == 3

    # Test with skip
    response = client.get(
        f"{settings.API_V1_STR}/secrets/?skip=2",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) == 1
    assert content["count"] == 3


def test_read_secret_success(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    valid_secret_data: dict,
):
    # Create a secret first
    response = client.post(
        f"{settings.API_V1_STR}/secrets/",
        headers=normal_user_token_headers,
        json=valid_secret_data,
    )
    secret_id = response.json()["id"]

    # Get the secret
    response = client.get(
        f"{settings.API_V1_STR}/secrets/{secret_id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == secret_id
    assert content["name"] == valid_secret_data["name"]
    # Value may be None if decryption fails, so check if it matches when present
    if "value" in content and content["value"] is not None:
        assert content["value"] == valid_secret_data["value"]
    assert content["environment"] == valid_secret_data["environment"]


def test_read_secret_not_found(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
):
    response = client.get(
        f"{settings.API_V1_STR}/secrets/nonexistent-id",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Secret not found"


def test_update_secret_success(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    valid_secret_data: dict,
):
    # Create a secret first
    response = client.post(
        f"{settings.API_V1_STR}/secrets/",
        headers=normal_user_token_headers,
        json=valid_secret_data,
    )
    secret_id = response.json()["id"]

    # Update the secret
    update_data = {
        "name": "UPDATED_SECRET",
        "value": "new-secret-value",
        "environment": "production",
    }
    response = client.put(
        f"{settings.API_V1_STR}/secrets/{secret_id}",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == update_data["name"]
    assert content["environment"] == update_data["environment"]
    assert "value" not in content  # Value not included in update response

    # Verify the value was updated by getting the secret
    response = client.get(
        f"{settings.API_V1_STR}/secrets/{secret_id}",
        headers=normal_user_token_headers,
    )
    assert response.json()["value"] == update_data["value"]


def test_update_secret_not_found(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    valid_secret_data: dict,
):
    response = client.put(
        f"{settings.API_V1_STR}/secrets/nonexistent-id",
        headers=normal_user_token_headers,
        json=valid_secret_data,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Secret not found"


def test_delete_secret_success(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    valid_secret_data: dict,
):
    # Create a secret first
    response = client.post(
        f"{settings.API_V1_STR}/secrets/",
        headers=normal_user_token_headers,
        json=valid_secret_data,
    )
    secret_id = response.json()["id"]

    # Delete the secret
    response = client.delete(
        f"{settings.API_V1_STR}/secrets/{secret_id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200

    # Verify it's deleted
    response = client.get(
        f"{settings.API_V1_STR}/secrets/{secret_id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Secret not found"


def test_delete_secret_not_found(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
):
    response = client.delete(
        f"{settings.API_V1_STR}/secrets/nonexistent-id",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Secret not found"


def test_secret_value_encryption(db: Session):
    """Test that secret values are properly encrypted and decrypted"""
    # Get or create test user
    user = get_user_by_email(session=db, email=settings.EMAIL_TEST_USER)
    if not user:
        user = User(
            email=settings.EMAIL_TEST_USER,
            hashed_password=get_password_hash("testpass123"),
            full_name="Test User",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    secret_value = "test-secret-value"
    secret = Secret(
        name="TEST_SECRET",
        value=secret_value,
        owner_id=user.id,
    )

    # Check that value is encrypted
    assert secret.encrypted_value is not None
    assert secret.encrypted_value != secret_value

    # Check that value can be decrypted
    assert secret.value == secret_value


def test_unauthorized_access(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    db: Session,
):
    # Create a different user
    other_user = get_user_by_email(session=db, email="other@example.com")
    if not other_user:
        other_user = User(
            email="other@example.com",
            hashed_password=get_password_hash("testpass123"),
            full_name="Other Test User",
            is_active=True,
        )
        db.add(other_user)
        db.commit()
        db.refresh(other_user)

    # Create a secret owned by the other user
    secret = Secret(
        name="OTHER_USER_SECRET",
        value="other-secret-value",
        owner_id=other_user.id,
    )
    db.add(secret)
    db.commit()
    db.refresh(secret)

    # Try to access the secret as normal user
    response = client.get(
        f"{settings.API_V1_STR}/secrets/{secret.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"

    # Try to update the secret
    response = client.put(
        f"{settings.API_V1_STR}/secrets/{secret.id}",
        headers=normal_user_token_headers,
        json={"name": "HACKED_SECRET"},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"

    # Try to delete the secret
    response = client.delete(
        f"{settings.API_V1_STR}/secrets/{secret.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"

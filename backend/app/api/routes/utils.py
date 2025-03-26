from fastapi import APIRouter, Depends
from pydantic.networks import EmailStr

from app.api.deps import get_current_active_superuser
from app.models import UtilsMessage
from app.utils import generate_test_email, send_email

router = APIRouter()


@router.post(
    "/test-email/",
    dependencies=[Depends(get_current_active_superuser)],
    status_code=201,
)
def test_email(email_to: EmailStr) -> UtilsMessage:
    """
    Test emails.
    """
    email_data = generate_test_email(email_to=email_to)
    send_email(
        email_to=email_to,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )
    return UtilsMessage(message="Test email sent")


@router.post(
    "/hello",
)
def test_sample() -> UtilsMessage:
    """
    Test emails.
    """
    return UtilsMessage(message="Hello World!")


@router.get("/health")
def health_check() -> UtilsMessage:
    """
    Health check endpoint to verify API is running.
    """
    return UtilsMessage(message="OK")

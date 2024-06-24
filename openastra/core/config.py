import os


class LogConfig:
    # Log directory and file name
    LOG_DIR = os.environ.get("LOG_DIR", "logs")
    LOG_FILE = os.environ.get("LOG_FILE", "openastra.log")

    # Base logging level
    BASE_LOG_LEVEL = os.environ.get("BASE_LOG_LEVEL", "INFO")

    # Log rotation settings
    MAX_LOG_SIZE = int(os.environ.get("MAX_LOG_SIZE", 1024 * 1024))  # 1 MB
    BACKUP_COUNT = int(os.environ.get("BACKUP_COUNT", 5))
    ROTATION_INTERVAL = os.environ.get("ROTATION_INTERVAL", "D")  # D for daily

    # Sentry configuration
    SENTRY_DSN = os.environ.get("SENTRY_DSN", "")

    # Log format
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Console logging colors
    CONSOLE_COLORS = {
        "DEBUG": "cyan",
        "INFO": "green",
        "WARNING": "yellow",
        "ERROR": "red",
        "CRITICAL": "red,bg_white",
    }

    # Minimum log levels for different handlers
    CONSOLE_LOG_LEVEL = os.environ.get("CONSOLE_LOG_LEVEL", "INFO")
    FILE_LOG_LEVEL = os.environ.get("FILE_LOG_LEVEL", "DEBUG")

    # Enable/disable specific handlers
    ENABLE_CONSOLE_HANDLER = (
        os.environ.get("ENABLE_CONSOLE_HANDLER", "true").lower() == "true"
    )
    ENABLE_FILE_HANDLER = (
        os.environ.get("ENABLE_FILE_HANDLER", "true").lower() == "true"
    )
    ENABLE_SENTRY = os.environ.get("ENABLE_SENTRY", "false").lower() == "true"

    # Additional Sentry options
    SENTRY_ENVIRONMENT = os.environ.get("SENTRY_ENVIRONMENT", "production")
    SENTRY_RELEASE = os.environ.get("SENTRY_RELEASE", "1.0.0")

    # Performance settings
    ASYNC_LOGGING = os.environ.get("ASYNC_LOGGING", "false").lower() == "true"

    SENSITIVE_PATTERNS = ["api_key", "jwt_secret", "ssh_password", "password"]

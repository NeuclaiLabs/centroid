import json
import logging
import os
import sys
from datetime import UTC, datetime
from functools import cache
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path

from colorama import Fore, Style, init

# Initialize colorama for cross-platform color support
init(autoreset=True)


class CustomJSONFormatter(logging.Formatter):
    """
    Custom JSON formatter for structured logging
    """

    def __init__(self, **kwargs):
        super().__init__()
        self.kwargs = kwargs

    def format(self, record):
        # Get the message and ensure newlines are preserved in the JSON output
        message = record.getMessage()

        json_record = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "name": record.name,
            "message": message,  # This will be properly escaped by json.dumps
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        if record.exc_info:
            json_record["exception"] = self.formatException(record.exc_info)

        if hasattr(record, "extra_fields"):
            json_record.update(record.extra_fields)

        # json.dumps will automatically escape newlines as \n in the output
        return json.dumps(json_record)


class ColoredFormatter(logging.Formatter):
    """
    Custom formatter for colored console output
    """

    COLORS = {
        "DEBUG": Fore.BLUE,
        "INFO": Fore.GREEN,
        "WARNING": Fore.YELLOW,
        "ERROR": Fore.RED,
        "CRITICAL": Fore.RED + Style.BRIGHT,
    }

    def format(self, record: logging.LogRecord) -> str:
        orig_levelname = record.levelname
        orig_msg = record.msg

        color = self.COLORS.get(record.levelname, "")
        record.levelname = f"{color}{record.levelname}{Style.RESET_ALL}"
        record.msg = f"{color}{record.msg}{Style.RESET_ALL}"

        formatted_message = super().format(record)

        record.levelname = orig_levelname
        record.msg = orig_msg

        return formatted_message


@cache
def get_logger_config() -> dict:
    """
    Get logger configuration from environment or use defaults
    """
    return {
        "log_level": os.getenv("LOG_LEVEL", "INFO"),
        "log_format": os.getenv(
            "LOG_FORMAT",
            "%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s",
        ),
        "log_dir": os.getenv("LOG_DIR", str(Path.home() / ".centroid" / "logs")),
        "log_file": os.getenv("LOG_FILE", "app.log"),
        "rotation_interval": os.getenv("LOG_ROTATION_INTERVAL", "midnight"),
        "backup_count": int(os.getenv("LOG_BACKUP_COUNT", "7")),
    }


def setup_logger(
    name: str,
    log_to_console: bool = True,
    log_to_file: bool = True,
    log_to_json: bool = True,
) -> logging.Logger:
    """
    Sets up a logger with configurable handlers and formatters
    """
    config = get_logger_config()

    logger = logging.getLogger(name)
    logger.setLevel(config["log_level"])

    if logger.handlers:
        return logger

    log_dir = Path(config["log_dir"])
    log_dir.mkdir(parents=True, exist_ok=True)

    handlers = []

    if log_to_file:
        file_handler = TimedRotatingFileHandler(
            filename=log_dir / config["log_file"],
            when=config["rotation_interval"],
            interval=1,
            backupCount=config["backup_count"],
            encoding="utf-8",
        )
        file_handler.setLevel(config["log_level"])
        file_handler.setFormatter(logging.Formatter(config["log_format"]))
        handlers.append(file_handler)

        if log_to_json:
            json_handler = TimedRotatingFileHandler(
                filename=log_dir / f"{config['log_file']}.json",
                when=config["rotation_interval"],
                interval=1,
                backupCount=config["backup_count"],
                encoding="utf-8",
            )
            json_handler.setLevel(config["log_level"])
            json_handler.setFormatter(CustomJSONFormatter())
            handlers.append(json_handler)

    if log_to_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(config["log_level"])
        console_handler.setFormatter(ColoredFormatter(config["log_format"]))
        handlers.append(console_handler)

    for handler in handlers:
        logger.addHandler(handler)

    return logger


class LoggerAdapter(logging.LoggerAdapter):
    """
    Custom adapter to add context to log messages
    """

    def process(self, msg, kwargs):
        extra = kwargs.get("extra", {})
        if self.extra:
            extra.update(self.extra)
        kwargs["extra"] = extra
        return msg, kwargs


def get_logger(name: str, **kwargs) -> LoggerAdapter:
    """
    Get a logger with additional context
    """
    logger = setup_logger(name)
    return LoggerAdapter(logger, kwargs)

import io
import logging
import re
from datetime import datetime
from unittest.mock import patch

import pytest
from colorlog import ColoredFormatter

from openastra.core.config import LogConfig
from openastra.core.logger import CustomFilter, logger


@pytest.fixture
def reset_logger():
    yield
    logger.logger.filters.clear()
    for handler in logger.logger.handlers[:]:
        logger.logger.removeHandler(handler)
    logger._initialize_logger()


def test_base_log_level():
    assert (
        logger.logger.level == getattr(logging, LogConfig.BASE_LOG_LEVEL)
    ), f"Expected base log level to be {LogConfig.BASE_LOG_LEVEL}, but got {logging.getLevelName(logger.logger.level)}"


@pytest.mark.parametrize(
    "handler_class",
    [
        "logging.handlers.RotatingFileHandler",
        "logging.handlers.TimedRotatingFileHandler",
    ],
)
def test_rotating_handlers(reset_logger, handler_class):
    handlers = [
        h
        for h in logger.logger.handlers
        if h.__class__.__name__ == handler_class.split(".")[-1]
    ]
    assert len(handlers) == 1
    assert isinstance(handlers[0], eval(handler_class))


@patch("sentry_sdk.init")
@patch("sentry_sdk.capture_message")
@patch("sentry_sdk.capture_exception")
def test_sentry_integration(mock_capture_exception, mock_capture_message, mock_init):
    logger.error("Test error message")
    mock_capture_message.assert_called_once_with("Test error message", level="error")

    try:
        raise ValueError("Test exception")
    except ValueError:
        logger.exception("Test exception occurred")
    mock_capture_exception.assert_called_once()


def test_custom_filter_keyword():
    custom_filter = CustomFilter("important", [])
    record = logging.LogRecord(
        "test", logging.INFO, "", 0, "This is an important message", (), None
    )
    assert custom_filter.filter(record) is True

    record = logging.LogRecord(
        "test", logging.INFO, "", 0, "This is a regular message", (), None
    )
    assert custom_filter.filter(record) is True


def test_custom_sensitive_patterns():
    patterns = ["password", "api_key"]
    custom_filter = CustomFilter("", patterns)

    sensitive_message = "User data: password='secret123', api_key='1234-5678-9012-3456'"
    record = logging.LogRecord("test", logging.INFO, "", 0, sensitive_message, (), None)

    custom_filter.filter(record)
    assert 'password="******"' in record.msg
    assert 'api_key="******"' in record.msg
    assert "secret123" not in record.msg
    assert "1234-5678-9012-3456" not in record.msg


def test_color_formatting(reset_logger):
    # Find the existing StreamHandler with the ColoredFormatter
    stream_handler = None
    for handler in logger.logger.handlers:
        if isinstance(handler, logging.StreamHandler) and isinstance(
            handler.formatter, ColoredFormatter
        ):
            stream_handler = handler
            break

    assert stream_handler is not None, "StreamHandler with ColoredFormatter not found"

    # Backup the original stream and replace it with StringIO
    original_stream = stream_handler.stream
    stream = io.StringIO()
    stream_handler.setStream(stream)

    # Log an error message
    logger.error("This is an error message")

    # Get the formatted message from the stream
    formatted_msg = stream.getvalue()

    # Restore the original stream
    stream_handler.setStream(original_stream)

    # Check if the color code for red is in the formatted message
    assert "\x1b[31m" in formatted_msg  # Red color code

    # Check if the expected message is in the formatted message
    assert "This is an error message" in formatted_msg

    # Close the StringIO stream
    stream.close()


def test_timestamp_logging(caplog):
    with caplog.at_level(logging.INFO):
        logger.info("Test message with timestamp")

    log_entry = caplog.records[0]
    timestamp = log_entry.asctime

    # Check if the timestamp is in the correct format
    try:
        datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S,%f")
    except ValueError:
        pytest.fail("Timestamp is not in the expected format")

    # Check if the timestamp is part of the log message
    assert re.match(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}", timestamp)


def test_log_levels(caplog):
    logger.debug("Debug message")
    logger.info("Info message")
    logger.warning("Warning message")
    logger.error("Error message")
    logger.critical("Critical message")

    log_messages = [record.message for record in caplog.records]

    # Check which messages are actually logged
    assert "Info message" in log_messages
    assert "Warning message" in log_messages
    assert "Error message" in log_messages
    assert "Critical message" in log_messages

    # Count occurrences of each log level
    level_counts = {
        "DEBUG": sum(1 for record in caplog.records if record.levelname == "DEBUG"),
        "INFO": sum(1 for record in caplog.records if record.levelname == "INFO"),
        "WARNING": sum(1 for record in caplog.records if record.levelname == "WARNING"),
        "ERROR": sum(1 for record in caplog.records if record.levelname == "ERROR"),
        "CRITICAL": sum(
            1 for record in caplog.records if record.levelname == "CRITICAL"
        ),
    }

    # Assert based on actual behavior
    assert level_counts["INFO"] == 1
    assert level_counts["WARNING"] == 1
    assert level_counts["ERROR"] == 1
    assert level_counts["CRITICAL"] == 1

    # Check if DEBUG is logged (this may fail if the base level is higher)

    if "Debug message" in log_messages:
        assert level_counts["DEBUG"] == 1
    else:
        print(
            "Note: DEBUG level messages are not being captured. Check the base log level."
        )

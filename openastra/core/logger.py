import logging
import os
import re
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler

import sentry_sdk
from colorlog import ColoredFormatter
from sentry_sdk.integrations.logging import LoggingIntegration

from .config import LogConfig


class CustomFilter(logging.Filter):
    def __init__(self, keyword, filter_patterns):
        super().__init__()
        self.keyword = keyword
        self.sensitive_fields = self._compile_patterns(filter_patterns)

    def _compile_patterns(self, patterns):
        compiled_patterns = {}
        for pattern in patterns:
            regex = rf'\b{pattern}\b\s*=\s*[\'"]([^\'"]+)[\'"]'
            compiled_patterns[pattern] = regex
        return compiled_patterns

    def mask_sensitive_info(self, message):
        for key, pattern in self.sensitive_fields.items():
            message = re.sub(pattern, key + '="******"', message)
        return message

    def filter(self, record):
        if self.keyword in record.getMessage():
            record.msg = self.mask_sensitive_info(record.getMessage())
        return True


class Logger:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize_logger()
        return cls._instance

    def _initialize_logger(self):
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(getattr(logging, LogConfig.BASE_LOG_LEVEL))

        # Console handler with color
        console_handler = logging.StreamHandler()
        console_handler.setLevel(getattr(logging, LogConfig.BASE_LOG_LEVEL))
        color_formatter = ColoredFormatter(
            "%(log_color)s%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt=None,
            reset=True,
            log_colors={
                "DEBUG": "cyan",
                "INFO": "green",
                "WARNING": "yellow",
                "ERROR": "red",
                "CRITICAL": "red,bg_white",
            },
            secondary_log_colors={},
            style="%",
        )
        console_handler.setFormatter(color_formatter)
        self.logger.addHandler(console_handler)

        # File handler with rotation
        log_dir = LogConfig.LOG_DIR
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, LogConfig.LOG_FILE)

        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=LogConfig.MAX_LOG_SIZE,
            backupCount=LogConfig.BACKUP_COUNT,
        )
        file_handler.setLevel(logging.DEBUG)
        file_formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        file_handler.setFormatter(file_formatter)
        self.logger.addHandler(file_handler)

        # Timed rotating file handler
        timed_handler = TimedRotatingFileHandler(
            log_file + ".timed",
            when=LogConfig.ROTATION_INTERVAL,
            interval=1,
            backupCount=LogConfig.BACKUP_COUNT,
        )
        timed_handler.setLevel(logging.DEBUG)
        timed_handler.setFormatter(file_formatter)
        self.logger.addHandler(timed_handler)

        # Initialize Sentry
        sentry_logging = LoggingIntegration(
            level=logging.INFO,  # Capture info and above as breadcrumbs
            event_level=logging.ERROR,  # Send errors as events
        )
        sentry_sdk.init(dsn=LogConfig.SENTRY_DSN, integrations=[sentry_logging])

    def add_filter(self, keyword):
        custom_filter = CustomFilter(keyword, LogConfig.SENSITIVE_PATTERNS)
        self.logger.addFilter(custom_filter)

    def remove_filter(self):
        self.logger.filters.clear()

    def debug(self, message):
        self.logger.debug(message)

    def info(self, message):
        self.logger.info(message)

    def warning(self, message):
        self.logger.warning(message)

    def error(self, message, extra=None):
        self.logger.error(message, extra=extra)
        sentry_sdk.capture_message(message, level="error")

    def critical(self, message):
        self.logger.critical(message)

    def exception(self, message, exc_info=True):
        self.logger.exception(message, exc_info=exc_info)
        sentry_sdk.capture_exception()


logger = Logger()

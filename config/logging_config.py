# config/logging_config.py
import logging
from logging.handlers import RotatingFileHandler

def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")

    # Консольный обработчик
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Файловый обработчик с ротацией
    file_handler = RotatingFileHandler("app.log", maxBytes=2000000, backupCount=5)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
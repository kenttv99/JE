from fastapi import FastAPI
from api.endpoints.exchange_api import router as exchange_router
import logging

# Логирование
logger = logging.getLogger("server")
logger.setLevel(logging.DEBUG)

app = FastAPI()

# Подключение маршрутов из exchange_api
app.include_router(exchange_router, prefix="/api/v1")
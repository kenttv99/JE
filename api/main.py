from fastapi import FastAPI, Request
from api.endpoints import exchange_api
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI()

# Middleware для логирования запросов
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logging.info(f"Получен запрос: {request.method} {request.url}")
    response = await call_next(request)
    logging.info(f"Ответ: {response.status_code}")
    return response

# Регистрация маршрутов
app.include_router(exchange_api.router, prefix="/api/v1", tags=["exchange"])

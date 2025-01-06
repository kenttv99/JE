from fastapi import FastAPI, Request
from api.endpoints.exchange_api import router as exchange_router
from api.endpoints.auth_routers import router as auth_router  # Подключаем маршруты для аутентификации
import logging
from fastapi.openapi.utils import get_openapi

# Настройка логирования
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Инициализация приложения
app = FastAPI(
    title="Crypto Exchange API",
    version="1.0.0",
    description="API для управления криптовалютным обменником",
)

# Подключение маршрутов
app.include_router(exchange_router, prefix="/api/v1", tags=["Exchange"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authorization"])  # Регистрация маршрутов для аутентификации

# Middleware для логирования
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logging.info(f"Получен запрос: {request.method} {request.url}")
    response = await call_next(request)
    logging.info(f"Ответ: {response.status_code}")
    return response

# Кастомизация OpenAPI
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Crypto Exchange API",
        version="1.0.0",
        description="API для управления криптовалютным обменником",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "OAuth2PasswordBearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    for path in openapi_schema["paths"]:
        for method in openapi_schema["paths"][path]:
            openapi_schema["paths"][path][method]["security"] = [{"OAuth2PasswordBearer": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Запуск через Uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
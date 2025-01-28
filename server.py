import logging
from fastapi import FastAPI, Request
from fastapi.openapi.utils import get_openapi
from api.endpoints.exchange_routers import router as exchange_router
from api.endpoints.auth_routers import router as auth_router
from api.endpoints.user_orders_routers import router as user_orders_router
from api.endpoints.referrals_routers import router as referrals_router
from api.endpoints.roles_routers import router as roles_router
from api.endpoints.payments_routers import router as payments_routers
from api.endpoints.trader_routers import router as trader_routers
from fastapi.middleware.cors import CORSMiddleware

# Инициализация приложения
app = FastAPI(
    title="Crypto Exchange API",
    version="1.0.0",
    description="API для управления криптовалютным обменником",
)

#CORS
origins = [
    "http://localhost:3000",  # Замените на адрес вашего фронтенда
    "https://example.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Настройка логирования с ротацией
from config.logging_config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

# Подключение маршрутов
app.include_router(exchange_router, prefix="/api/v1", tags=["Exchange"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["User"])
app.include_router(trader_routers, prefix="/api/v1/traders", tags=["Traders"])
app.include_router(user_orders_router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(referrals_router, prefix="/api/v1/referrals", tags=["Referrals"])
app.include_router(roles_router, prefix="/api/v1/roles", tags=["Roles"])
app.include_router(payments_routers, prefix="/api/v1/payments", tags=["Payments"])

# Middleware для логирования
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Логирование входящих запросов и исходящих ответов."""
    logger.info(f"Получен запрос: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Ответ: {response.status_code}")
    return response

# Кастомизация OpenAPI
def custom_openapi():
    """Настройка OpenAPI схемы."""
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
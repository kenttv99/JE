import logging
from fastapi import FastAPI, Request
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware

from api.endpoints.exchange_routers import router as exchange_router
from api.endpoints.auth_routers import router as auth_router
from api.endpoints.user_orders_routers import router as user_orders_router
from api.endpoints.referrals_routers import router as referrals_router
from api.endpoints.roles_routers import router as roles_router
from api.endpoints.payments_routers import router as payments_router
from api.endpoints.trader_routers import router as trader_router
from api.endpoints.trader_addresses_routers import router as trader_addresses_router
from api.endpoints.timezone_routers import router as timezone_router
from api.endpoints.trader_methods_routers import router as trader_methods_router
from api.endpoints.trader_orders_router import router as trader_orders_router
from api.endpoints.trader_req_routers import router as trader_req_routers

# Initialize FastAPI app
app = FastAPI(
    title="Crypto Exchange API",
    version="1.0.0",
    description="API for managing a cryptocurrency exchange",
)

# CORS Configuration
origins = [
    "http://localhost:3000",  # Replace with your frontend address
    "https://example.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging Configuration
from config.logging_config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

# Include Routers
app.include_router(exchange_router, prefix="/api/v1/exchange", tags=["Exchange"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(user_orders_router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(referrals_router, prefix="/api/v1/referrals", tags=["Referrals"])
app.include_router(roles_router, prefix="/api/v1/roles", tags=["Roles"])
app.include_router(payments_router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(trader_router, prefix="/api/v1/traders", tags=["Traders"])
app.include_router(trader_addresses_router, prefix="/api/v1/trader_addresses", tags=["Trader Addresses"])
app.include_router(timezone_router, prefix="/api/v1/trader_timezones", tags=["Timezones"])
app.include_router(trader_methods_router, prefix="/api/v1/trader_methods", tags=["Trader Methods"])
app.include_router(trader_orders_router, prefix="/api/v1/trader_orders", tags=["Trader Orders"])
app.include_router(trader_req_routers, prefix="/api/v1/trader_req", tags=["Trader Requisites"])

# Middleware for Logging Requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log incoming requests and outgoing responses."""
    logger.info(f"Received request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response

# Custom OpenAPI
def custom_openapi():
    """Customize OpenAPI schema."""
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Crypto Exchange API",
        version="1.0.0",
        description="API for managing a cryptocurrency exchange",
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

# Run Uvicorn Server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
# JE/websocket_server.py
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.websockets.trader_orders_ws import get_websocket_router

# Initialize FastAPI app for WebSocket
app = FastAPI(
    title="Crypto Exchange WebSocket API",
    version="1.0.0",
    description="WebSocket API for real-time updates on the cryptocurrency exchange",
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

# Include WebSocket Router
@app.on_event("startup")
async def startup_event():
    logger.info("WebSocket server starting...")
    router = await get_websocket_router()
    app.include_router(router, prefix="/api/v1")  # Убедитесь, что префикс правильный

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("WebSocket server shutting down...")

# Custom endpoint for WebSocket documentation (without trader_id dependency)
@app.get("/ws/docs", response_model=dict)
async def get_websocket_docs():
    return {
        "endpoint": "/api/v1/ws/orders/{trader_id}",
        "description": "Real-time WebSocket channel for trader order updates",
        "parameters": {
            "trader_id": "Path parameter, string representation of trader ID (must be convertible to int)"
        },
        "client_messages": [
            {"type": "subscribe", "description": "Subscribe to order updates for the specified trader"}
        ],
        "server_messages": [
            {"type": "orders_update", "description": "List of trader orders in TraderOrderResponse format"},
            {"type": "error", "description": "Error message if connection fails or authorization fails"}
        ],
        "periodic_updates": "Every 5 seconds"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
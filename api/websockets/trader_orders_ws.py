# JE/api/websockets/trader_orders_ws.py
from fastapi import WebSocket, WebSocketDisconnect, Query
from typing import List, Dict
import json
import asyncio
from sqlalchemy import select
from api.auth import get_current_trader, create_access_token
from api.schemas import TraderOrderResponse
from api.endpoints.trader_orders_router import TraderOrder
from database.init_db import get_async_db  # Убедитесь, что это правильно импортирован
from jose import JWTError, jwt
from constants import SECRET_KEY, ALGORITHM

# Хранилище активных соединений (временное, для примера)
active_connections: Dict[str, List[WebSocket]] = {}

class WebSocketManager:
    def __init__(self):
        self.active_connections = {}

    async def connect(self, websocket: WebSocket, trader_id: str):
        await websocket.accept()
        if trader_id not in self.active_connections:
            self.active_connections[trader_id] = []
        self.active_connections[trader_id].append(websocket)
        print(f"WebSocket connection established for trader_id: {trader_id}")  # Отладочный лог

    def disconnect(self, websocket: WebSocket, trader_id: str):
        if trader_id in self.active_connections and websocket in self.active_connections[trader_id]:
            self.active_connections[trader_id].remove(websocket)
            print(f"WebSocket disconnected for trader_id: {trader_id}")  # Отладочный лог
            if not self.active_connections[trader_id]:
                del self.active_connections[trader_id]

    async def broadcast(self, trader_id: str, message: dict):
        if trader_id in self.active_connections:
            for connection in self.active_connections[trader_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error broadcasting to trader_id {trader_id}: {e}")

# Создаем экземпляр менеджера WebSocket
websocket_manager = WebSocketManager()

async def get_websocket_router():
    from fastapi import APIRouter

    router = APIRouter(prefix="/ws", tags=["WebSockets"])

    @router.websocket("/orders/{trader_id}")
    async def websocket_orders(websocket: WebSocket, trader_id: str, token: str = Query(..., description="JWT token for authentication")):
        # Авторизация трейдера через токен
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_email: str = payload.get("sub")
            if not user_email:
                await websocket.close(code=1008, reason="Invalid token")  # Policy Violation
                return
            print(f"Decoded token for trader_id: {trader_id}, email: {user_email}")  # Отладочный лог
        except JWTError as e:
            print(f"JWT decoding error for trader_id {trader_id}: {e}")
            await websocket.close(code=1008, reason="Invalid token")
            return

        # Получаем сессию базы данных
        async for db in get_async_db():  # Используем асинхронный итератор для правильной работы с get_async_db
            try:
                trader = await get_current_trader(token, db)  # Используем get_current_trader для авторизации
                if not trader or str(trader.id) != trader_id:
                    await websocket.close(code=1008, reason="Unauthorized trader")
                    return
            except Exception as e:
                print(f"Error authenticating trader_id {trader_id}: {e}")
                await websocket.close(code=1008, reason="Authentication failed")
                return

            await websocket_manager.connect(websocket, trader_id)

            try:
                # Получаем текущие ордера трейдера
                result = await db.execute(select(TraderOrder).filter(TraderOrder.trader_id == int(trader_id)))
                orders = result.scalars().all()
                orders_response = [TraderOrderResponse.from_orm(order) for order in orders]
                await websocket_manager.broadcast(trader_id, {"type": "orders_update", "orders": orders_response})
                print(f"Initial orders broadcast for trader_id: {trader_id}")  # Отладочный лог

                while True:
                    # Получаем данные от клиента (если есть)
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    print(f"Received message for trader_id {trader_id}: {message}")  # Отладочный лог

                    # Обработка сообщений от клиента (например, подписка)
                    if message.get("type") == "subscribe":
                        result = await db.execute(select(TraderOrder).filter(TraderOrder.trader_id == int(trader_id)))
                        orders = result.scalars().all()
                        orders_response = [TraderOrderResponse.from_orm(order) for order in orders]
                        await websocket_manager.broadcast(trader_id, {"type": "orders_update", "orders": orders_response})
                        print(f"Subscribed and broadcast orders for trader_id: {trader_id}")

                    # Симуляция периодических обновлений (замени на реальную логику)
                    await asyncio.sleep(5)  # Обновление каждые 5 секунд
                    result = await db.execute(select(TraderOrder).filter(TraderOrder.trader_id == int(trader_id)))
                    updated_orders = result.scalars().all()
                    updated_orders_response = [TraderOrderResponse.from_orm(order) for order in updated_orders]
                    await websocket_manager.broadcast(trader_id, {"type": "orders_update", "orders": updated_orders_response})
                    print(f"Periodic update broadcast for trader_id: {trader_id}")

            except WebSocketDisconnect as e:
                print(f"WebSocket disconnected for trader_id {trader_id}: {e.code}, {e.reason}")
                websocket_manager.disconnect(websocket, trader_id)
            except Exception as e:
                print(f"WebSocket error for trader_id {trader_id}: {e}")
                await websocket_manager.broadcast(trader_id, {"type": "error", "message": str(e)})
                websocket_manager.disconnect(websocket, trader_id)
            finally:
                await db.close()  # Закрываем сессию базы данных

    return router
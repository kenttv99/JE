from fastapi import APIRouter, HTTPException, Depends
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from database.init_db import SessionLocal, ExchangeOrder, OrderStatus, User
from pydantic import BaseModel
from typing import List
from api.auth import get_current_user

router = APIRouter()

# Подключение к базе данных через зависимость
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic модель для изменения статуса заявки
class UpdateOrderStatusRequest(BaseModel):
    status: OrderStatus

# Pydantic модель для получения заявок
class OrderResponse(BaseModel):
    id: int
    user_id: int
    order_type: str
    currency: str
    amount: float
    total_rub: float
    status: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

# Pydantic модель для создания заявки
class ExchangeOrderRequest(BaseModel):
    order_type: str
    currency: str
    amount: float
    total_rub: float

# Эндпоинт для получения списка заявок пользователя
@router.get("/orders", response_model=List[OrderResponse])
def get_user_orders(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    
    # Получаем user_id на основе email текущего пользователя
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    orders = db.query(ExchangeOrder).filter(ExchangeOrder.user_id == user.id).all()
    if not orders:
        raise HTTPException(status_code=404, detail="Заявки не найдены")
    return jsonable_encoder(orders)

# Эндпоинт для создания заявки
@router.post("/create_order")
async def create_exchange_order(
    order: ExchangeOrderRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)
):
    # Получаем user_id на основе email текущего пользователя
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    try:
        new_order = ExchangeOrder(
            user_id=user.id,  # Используем user.id
            order_type=order.order_type,
            currency=order.currency,
            amount=order.amount,
            total_rub=order.total_rub,
            status=OrderStatus.pending,
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        return {"message": "Заявка на обмен успешно создана", "order_id": new_order.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка создания заявки: {e}")

# Эндпоинт для отмены заявки
@router.post("/orders/{order_id}/cancel")
def cancel_order(order_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    order = db.query(ExchangeOrder).filter(ExchangeOrder.id == order_id, ExchangeOrder.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    if order.status not in [OrderStatus.pending, OrderStatus.processing]:
        raise HTTPException(status_code=400, detail="Заявку нельзя отменить")

    order.status = OrderStatus.canceled
    db.commit()
    return {"message": "Заявка успешно отменена", "order_id": order_id}

# Эндпоинт для изменения статуса заявки
@router.post("/orders/{order_id}/change_status")
def update_order_status(
    order_id: int, status_request: UpdateOrderStatusRequest, db: Session = Depends(get_db)
):
    order = db.query(ExchangeOrder).filter(ExchangeOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    # Логика смены статуса
    allowed_transitions = {
        OrderStatus.pending: [OrderStatus.processing, OrderStatus.canceled],
        OrderStatus.processing: [OrderStatus.completed, OrderStatus.arbitrage, OrderStatus.waiting_confirmation],
        OrderStatus.waiting_confirmation: [OrderStatus.completed, OrderStatus.arbitrage],
    }

    if order.status in allowed_transitions:
        if status_request.status not in allowed_transitions[order.status]:
            raise HTTPException(
                status_code=400,
                detail=f"Недопустимый переход из статуса {order.status.value} в {status_request.status.value}",
            )
    else:
        raise HTTPException(status_code=400, detail="Изменение статуса для текущей заявки невозможно")

    order.status = status_request.status
    db.commit()
    return {"message": "Статус заявки успешно обновлен", "order_id": order_id, "new_status": order.status.value}
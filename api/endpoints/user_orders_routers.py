from fastapi import APIRouter, HTTPException, Depends
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from database.init_db import ExchangeOrder, OrderStatus, User
from typing import List
from api.auth import get_current_user
from api.schemas import UpdateOrderStatusRequest, OrderResponse, ExchangeOrderRequest
from api.utils.user_utils import get_current_user_info, get_db
from datetime import datetime

# Создаем роутер
router = APIRouter()

# Получение всех заявок пользователя
@router.get("/orders", response_model=List[OrderResponse])
def get_user_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Получение всех заявок текущего пользователя.
    """
    user = get_current_user_info(db, current_user)
    orders = db.query(ExchangeOrder).filter(ExchangeOrder.user_id == user.id).all()
    if not orders:
        raise HTTPException(status_code=404, detail="Заявки не найдены")
    return jsonable_encoder(orders)

# Создание новой заявки на обмен
@router.post("/create_order")
async def create_exchange_order(
    order: ExchangeOrderRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Создание новой заявки на обмен валюты для текущего пользователя.
    """
    user = get_current_user_info(db, current_user)
    try:
        new_order = ExchangeOrder(
            user_id=user.id,
            order_type=order.order_type,
            currency=order.currency,
            amount=order.amount,
            total_rub=order.total_rub,
            status=OrderStatus.pending,
            updated_at=datetime.utcnow()  # Установка времени обновления
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        return {"message": "Заявка на обмен успешно создана", "order_id": new_order.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Ошибка создания заявки")

# Отмена заявки на обмен
@router.post("/orders/{order_id}/cancel")
def cancel_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Отмена заявки на обмен валюты для текущего пользователя.
    """
    user = get_current_user_info(db, current_user)
    order = db.query(ExchangeOrder).filter(ExchangeOrder.id == order_id, ExchangeOrder.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    # if order.status not in [OrderStatus.pending, OrderStatus.processing, OrderStatus.completed]:
    #     raise HTTPException(status_code=400, detail="Заявку нельзя отменить")

    order.status = OrderStatus.canceled
    order.updated_at = datetime.utcnow()  # Обновление времени
    db.commit()
    return {"message": "Заявка успешно отменена", "order_id": order_id}

# Обновление статуса заявки на обмен
@router.post("/orders/{order_id}/change_status")
def update_order_status(
    order_id: int, status_request: UpdateOrderStatusRequest, db: Session = Depends(get_db)
):
    """
    Обновление статуса заявки на обмен валюты.
    """
    order = db.query(ExchangeOrder).filter(ExchangeOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    allowed_transitions = {
        OrderStatus.pending: [OrderStatus.processing, OrderStatus.canceled],
        OrderStatus.processing: [OrderStatus.completed, OrderStatus.arbitrage, OrderStatus.waiting_confirmation],
        OrderStatus.waiting_confirmation: [OrderStatus.completed, OrderStatus.arbitrage],
        OrderStatus.completed: [OrderStatus.canceled, OrderStatus.processing, OrderStatus.pending, OrderStatus.arbitrage, OrderStatus.waiting_confirmation],
        OrderStatus.canceled: [OrderStatus.completed, OrderStatus.processing, OrderStatus.pending, OrderStatus.arbitrage, OrderStatus.waiting_confirmation]
    }

    if order.status in allowed_transitions:
        if status_request.status not in allowed_transitions[order.status]:
            raise HTTPException(
                status_code=400,
                detail=f"Недопустимый переход из статуса {order.status} в {status_request.status}",
            )
    else:
        raise HTTPException(status_code=400, detail="Изменение статуса для текущей заявки невозможно")

    order.status = status_request.status
    order.updated_at = datetime.utcnow()  # Обновление времени
    db.commit()
    db.refresh(order)
    return {"message": "Статус заявки успешно обновлен", "order_id": order_id, "new_status": order.status}

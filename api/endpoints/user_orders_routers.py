# api/endpoints/user_orders_routers.py

import logging  # Импортируем стандартный модуль логирования
from fastapi import APIRouter, HTTPException, Depends
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession  # Используем AsyncSession для асинхронных операций
from sqlalchemy.future import select  # Используем select для построения запросов
from typing import List, Optional
from api.auth import get_current_user
from api.schemas import UpdateOrderStatusRequest, OrderResponse, ExchangeOrderRequest
from api.utils.user_utils import get_current_user_info
from database.init_db import ExchangeOrder, OrderStatus, User, get_async_db
from datetime import datetime

# Импортируем настроенный логгер
from config.logging_config import logger

# Создаём роутер
router = APIRouter()

# Получение всех заявок пользователя с поддержкой сортировки и фильтрации
@router.get("/orders", response_model=List[OrderResponse])
async def get_user_orders(
    db: AsyncSession = Depends(get_async_db),  # Используем AsyncSession
    current_user: User = Depends(get_current_user),
    status: Optional[OrderStatus] = None,
    sort_by: Optional[str] = None,
    order: Optional[str] = "asc"
):
    """
    Получение всех заявок текущего пользователя с поддержкой сортировки и фильтрации.

    :param status: OrderStatus - Фильтр по статусу заявки.
    :param sort_by: str - Поле для сортировки (например, "created_at").
    :param order: str - Порядок сортировки ("asc" или "desc").
    :param db: AsyncSession - Асинхронная сессия базы данных.
    :param current_user: User - Текущий пользователь.
    :return: List[OrderResponse] - Список схем ответов с заявками.
    """
    try:
        logger.info(f"Получен запрос на получение ордеров для пользователя ID: {current_user.id}")
        
        # Получаем актуальную информацию о пользователе
        user = await get_current_user_info(db, current_user)  # Добавлен await
        
        # Создаём запрос с использованием select()
        stmt = select(ExchangeOrder).where(ExchangeOrder.user_id == user.id)
        
        # Применяем фильтр по статусу, если указан
        if status:
            stmt = stmt.where(ExchangeOrder.status == status)
        
        # Применяем сортировку, если указано
        if sort_by:
            order_by_column = getattr(ExchangeOrder, sort_by, None)
            if order_by_column is not None:
                if order.lower() == "desc":
                    stmt = stmt.order_by(order_by_column.desc())
                else:
                    stmt = stmt.order_by(order_by_column.asc())
        
        # Выполняем запрос
        result = await db.execute(stmt)
        orders = result.scalars().all()
        
        if not orders:
            logger.warning(f"Заявки не найдены для пользователя ID: {user.id}")
            raise HTTPException(status_code=404, detail="Заявки не найдены")
        
        logger.info(f"Найдено {len(orders)} заявок для пользователя ID: {user.id}")
        return jsonable_encoder(orders)
    
    except HTTPException as http_exc:
        # Пробрасываем уже обработанные HTTP-исключения
        raise http_exc
    except Exception as e:
        # Логирование ошибки с трассировкой стека
        logger.error(f"Ошибка при получении ордеров пользователя ID {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Ошибка сервера при получении заявок")


# Создание новой заявки на обмен
@router.post("/create_order")
async def create_exchange_order(
    order: ExchangeOrderRequest, 
    db: AsyncSession = Depends(get_async_db),  # Используем AsyncSession
    current_user: User = Depends(get_current_user)
):
    """
    Создание новой заявки на обмен валюты для текущего пользователя.
    """
    try:
        logger.info(f"Создание новой заявки на обмен для пользователя ID: {current_user.id}")
        
        # Получаем актуальную информацию о пользователе
        user = await get_current_user_info(db, current_user)  # Добавлен await
        
        # Создание новой заявки
        new_order = ExchangeOrder(
            user_id=user.id,
            order_type=order.order_type,
            currency=order.currency,
            amount=order.amount,
            total_rub=order.total_rub,
            status=OrderStatus.pending,
            created_at=datetime.utcnow(),  # Установка времени создания
            updated_at=datetime.utcnow()   # Установка времени обновления
        )
        db.add(new_order)
        await db.commit()
        await db.refresh(new_order)
        
        logger.info(f"Заявка на обмен успешно создана: Order ID {new_order.id}")
        return {"message": "Заявка на обмен успешно создана", "order_id": new_order.id}
    
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Ошибка при создании заявки пользователя ID {current_user.id}: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail="Ошибка создания заявки")


# Отмена заявки на обмен
@router.post("/orders/{order_id}/cancel")
async def cancel_order(
    order_id: int, 
    db: AsyncSession = Depends(get_async_db),  # Используем AsyncSession
    current_user: User = Depends(get_current_user)
):
    """
    Отмена заявки на обмен валюты для текущего пользователя.
    """
    try:
        logger.info(f"Попытка отмены заявки ID {order_id} пользователем ID: {current_user.id}")
        
        # Получаем актуальную информацию о пользователе
        user = await get_current_user_info(db, current_user)  # Добавлен await
        
        # Создаём запрос для получения заявки
        stmt = select(ExchangeOrder).where(
            ExchangeOrder.id == order_id,
            ExchangeOrder.user_id == user.id
        )
        result = await db.execute(stmt)
        order = result.scalars().first()
        
        if not order:
            logger.warning(f"Заявка ID {order_id} не найдена для пользователя ID: {user.id}")
            raise HTTPException(status_code=404, detail="Заявка не найдена")
        
        # Обновляем статус заявки
        order.status = OrderStatus.canceled
        order.updated_at = datetime.utcnow()  # Обновление времени
        await db.commit()
        
        logger.info(f"Заявка ID {order_id} успешно отменена пользователем ID: {user.id}")
        return {"message": "Заявка успешно отменена", "order_id": order_id}
    
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Ошибка при отмене заявки ID {order_id} пользователя ID {current_user.id}: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail="Ошибка отмены заявки")


# Обновление статуса заявки на обмен
@router.post("/orders/{order_id}/change_status")
async def update_order_status(
    order_id: int, 
    status_request: UpdateOrderStatusRequest, 
    db: AsyncSession = Depends(get_async_db)  # Используем AsyncSession
):
    """
    Обновление статуса заявки на обмен валюты.
    """
    try:
        logger.info(f"Попытка обновления статуса заявки ID {order_id} на {status_request.status}")
        
        # Создаём запрос для получения заявки
        stmt = select(ExchangeOrder).where(ExchangeOrder.id == order_id)
        result = await db.execute(stmt)
        order = result.scalars().first()
        
        if not order:
            logger.warning(f"Заявка ID {order_id} не найдена")
            raise HTTPException(status_code=404, detail="Заявка не найдена")
        
        # Определяем допустимые переходы статусов
        allowed_transitions = {
            OrderStatus.pending: [OrderStatus.processing, OrderStatus.canceled],
            OrderStatus.processing: [OrderStatus.completed, OrderStatus.arbitrage, OrderStatus.waiting_confirmation],
            OrderStatus.waiting_confirmation: [OrderStatus.completed, OrderStatus.arbitrage],
            OrderStatus.completed: [OrderStatus.canceled, OrderStatus.processing, OrderStatus.pending, OrderStatus.arbitrage, OrderStatus.waiting_confirmation],
            OrderStatus.canceled: [OrderStatus.completed, OrderStatus.processing, OrderStatus.pending, OrderStatus.arbitrage, OrderStatus.waiting_confirmation]
        }

        # Проверяем допустимость перехода статуса
        if order.status in allowed_transitions:
            if status_request.status not in allowed_transitions[order.status]:
                logger.error(f"Недопустимый переход из статуса {order.status} в {status_request.status}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Недопустимый переход из статуса {order.status} в {status_request.status}",
                )
        else:
            logger.error(f"Изменение статуса для текущей заявки ID {order_id} невозможно")
            raise HTTPException(status_code=400, detail="Изменение статуса для текущей заявки невозможно")
        
        # Обновляем статус заявки
        order.status = status_request.status
        order.updated_at = datetime.utcnow()  # Обновление времени
        await db.commit()
        await db.refresh(order)
        
        logger.info(f"Статус заявки ID {order_id} успешно обновлен на {order.status}")
        return {"message": "Статус заявки успешно обновлен", "order_id": order_id, "new_status": order.status}
    
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Ошибка при обновлении статуса заявки ID {order_id}: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail="Ошибка обновления статуса заявки")
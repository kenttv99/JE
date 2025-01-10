# api/endpoints/user_orders_routers.py

from decimal import Decimal
from fastapi import APIRouter, HTTPException, Depends
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from api.enums import OrderTypeEnum
from database.init_db import ExchangeOrder, OrderStatus, User, get_async_db, PaymentMethod, PaymentMethodEnum, ExchangeRate  # Добавлен ExchangeRate
from typing import List, Optional
from api.auth import get_current_user
from api.schemas import UpdateOrderStatusRequest, OrderResponse, ExchangeOrderRequest, PaymentMethodSchema
from api.utils.user_utils import get_current_user_info
from datetime import datetime
import logging


# Настройка логирования
from config.logging_config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

# Создаем роутер
router = APIRouter()


# Получение всех методов оплаты
@router.get("/payment_methods", response_model=List[PaymentMethodSchema])
async def get_payment_methods(db: AsyncSession = Depends(get_async_db)):
    """
    Получение списка всех доступных методов оплаты.
    """
    try:
        stmt = select(PaymentMethod)
        result = await db.execute(stmt)
        payment_methods = result.scalars().all()

        if not payment_methods:
            raise HTTPException(status_code=404, detail="Методы оплаты не найдены")

        return jsonable_encoder(payment_methods)
    except HTTPException as http_exc:
        logger.error(f"Ошибка при получении методов оплаты: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"Неизвестная ошибка при получении методов оплаты: {e}")
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")


# Получение всех заявок пользователя с поддержкой сортировки и фильтрации
@router.get("/orders", response_model=List[OrderResponse])
async def get_user_orders(
    db: AsyncSession = Depends(get_async_db),
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
    :param db: AsyncSession - Сессия базы данных.
    :param current_user: User - Текущий пользователь.
    :return: List[OrderResponse] - Список схем ответов с заявками.
    """
    try:
        user = await get_current_user_info(db, current_user)
        stmt = select(ExchangeOrder).options(joinedload(ExchangeOrder.payment_method)).filter(ExchangeOrder.user_id == user.id)

        if status:
            stmt = stmt.filter(ExchangeOrder.status == status)

        if sort_by:
            sort_column = getattr(ExchangeOrder, sort_by, None)
            if sort_column is not None:
                if order == "desc":
                    sort_column = sort_column.desc()
                else:
                    sort_column = sort_column.asc()
                stmt = stmt.order_by(sort_column)

        result = await db.execute(stmt)
        orders = result.scalars().all()

        if not orders:
            raise HTTPException(status_code=404, detail="Заявки не найдены")

        return jsonable_encoder(orders)

    except HTTPException as http_exc:
        logger.error(f"Ошибка при получении заявок пользователя ID {current_user.id}: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"Неизвестная ошибка при получении заявок пользователя ID {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")


# Создание новой заявки на обмен
@router.post("/create_order")
async def create_exchange_order(
    order: ExchangeOrderRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Создание новой заявки на обмен валюты для текущего пользователя с учетом median_rate.
    Пользователь может указать:
    - amount (количество BTC), тогда total_rub рассчитывается автоматически;
    - total_rub (сумма в рублях), тогда amount рассчитывается автоматически.
    """
    try:
        # Шаг 1: Получаем median_rate для BTC/RUB из базы данных
        stmt = select(ExchangeRate).where(ExchangeRate.currency == order.currency)
        result = await db.execute(stmt)
        exchange_rate = result.scalar_one_or_none()

        if not exchange_rate:
            raise HTTPException(
                status_code=500, detail=f"Не удалось найти информацию о курсе для {order.currency}"
            )

        median_rate = exchange_rate.median_rate

        if median_rate is None:
            raise HTTPException(
                status_code=500, detail=f"Median rate для {order.currency} не установлен"
            )

        # Шаг 2: Расчет недостающего поля (amount или total_rub) с использованием median_rate
        input_amount = order.amount
        input_total_rub = order.total_rub

        if input_amount is not None and input_total_rub is None:
            # Рассчитываем total_rub на основании amount и median_rate
            calculated_total = input_amount * median_rate
            order.total_rub = calculated_total.quantize(Decimal('1.00'))
        elif input_total_rub is not None and input_amount is None:
            # Рассчитываем amount на основании total_rub и median_rate
            calculated_amount = input_total_rub / median_rate
            order.amount = calculated_amount.quantize(Decimal('0.00000001'))
        # Если (amount и total_rub) уже пришли заполненными или оба пустые
        # - логика валидации остановится на уровне схемы (validator)

        # Шаг 3: Ищем указанный метод оплаты
        stmt = (
            select(PaymentMethod)
            .where(PaymentMethod.method_name == order.payment_method)
        )
        result = await db.execute(stmt)
        payment_method = result.scalar_one_or_none()

        if not payment_method:
            logger.warning(f"Метод оплаты {order.payment_method} не найден")
            raise HTTPException(
                status_code=404, detail="Выбранный метод оплаты не найден"
            )

        # Шаг 4: Создаем новый объект заявки
        new_order = ExchangeOrder(
            user_id=current_user.id,
            order_type=order.order_type,
            currency=order.currency,
            amount=order.amount,
            total_rub=order.total_rub,
            status=OrderStatus.pending,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            crypto_address=order.crypto_address,
            crypto_network=order.crypto_network,
            payment_method=payment_method
        )

        # Шаг 5: Сохраняем объект заявки в БД
        db.add(new_order)
        await db.flush()
        await db.commit()

        logger.info(
            f"Пользователь {current_user.email} успешно создал заявку. "
            f"Order ID: {new_order.id}, Type: {new_order.order_type}, Amount: {new_order.amount}, Total RUB: {new_order.total_rub}"
        )
        return {
            "message": "Заявка на обмен успешно создана",
            "order_id": new_order.id,
            "amount": str(new_order.amount),
            "total_rub": str(new_order.total_rub),
            "order_type": new_order.order_type.value
        }

    except HTTPException as http_exc:
        logger.error(f"HTTP ошибка при создании заявки: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        # Откатываем изменения в случае ошибки
        await db.rollback()
        logger.error(f"Неожиданная ошибка при создании заявки: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка создания заявки: {str(e)}"
        )


# Отмена заявки на обмен
@router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: int, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    """
    Отмена заявки на обмен валюты для текущего пользователя.
    """
    try:
        user = await get_current_user_info(db, current_user)
        stmt = select(ExchangeOrder).filter(ExchangeOrder.id == order_id, ExchangeOrder.user_id == user.id)
        result = await db.execute(stmt)
        order = result.scalars().first()

        if not order:
            logger.warning(f"Заявка ID {order_id} не найдена для пользователя ID {user.id}")
            raise HTTPException(status_code=404, detail="Заявка не найдена")

        if order.status in [OrderStatus.completed, OrderStatus.canceled]:
            logger.warning(f"Попытка отмены заявки ID {order_id} с неподходящим статусом {order.status}")
            raise HTTPException(status_code=400, detail=f"Невозможно отменить заявку со статусом {order.status}")

        order.status = OrderStatus.canceled
        order.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(order)
        logger.info(f"Заявка ID {order_id} пользователя ID {user.id} успешно отменена")
        return {"message": "Заявка успешно отменена", "order_id": order_id}

    except HTTPException as http_exc:
        logger.error(f"Ошибка при отмене заявки ID {order_id} пользователя ID {current_user.id}: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        await db.rollback()
        logger.error(f"Неизвестная ошибка при отмене заявки ID {order_id} пользователя ID {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Ошибка при отмене заявки")


# Обновление статуса заявки на обмен
@router.post("/orders/{order_id}/change_status")
async def update_order_status(
    order_id: int, status_request: UpdateOrderStatusRequest, db: AsyncSession = Depends(get_async_db)
):
    """
    Обновление статуса заявки на обмен валюты.
    """
    try:
        stmt = select(ExchangeOrder).filter(ExchangeOrder.id == order_id)
        result = await db.execute(stmt)
        order = result.scalars().first()

        if not order:
            logger.warning(f"Заявка ID {order_id} не найдена для обновления статуса")
            raise HTTPException(status_code=404, detail="Заявка не найдена")

        allowed_transitions = {
            OrderStatus.pending: [OrderStatus.processing, OrderStatus.canceled, OrderStatus.completed],
            OrderStatus.processing: [OrderStatus.completed, OrderStatus.arbitrage, OrderStatus.waiting_confirmation],
            OrderStatus.waiting_confirmation: [OrderStatus.completed, OrderStatus.arbitrage],
            OrderStatus.completed: [OrderStatus.canceled, OrderStatus.processing, OrderStatus.pending, OrderStatus.arbitrage, OrderStatus.waiting_confirmation],
            OrderStatus.canceled: [OrderStatus.completed, OrderStatus.processing, OrderStatus.pending, OrderStatus.arbitrage, OrderStatus.waiting_confirmation]
        }

        current_status = order.status
        new_status = status_request.status

        if current_status in allowed_transitions:
            if new_status not in allowed_transitions[current_status]:
                logger.warning(
                    f"Недопустимый переход из статуса {current_status} в {new_status} для заявки ID {order_id}"
                )
                raise HTTPException(
                    status_code=400,
                    detail=f"Недопустимый переход из статуса {current_status} в {new_status}",
                )
        else:
            logger.warning(f"Изменение статуса для текущей заявки ID {order_id} невозможно")
            raise HTTPException(status_code=400, detail="Изменение статуса для текущей заявки невозможно")

        order.status = new_status
        order.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(order)
        logger.info(f"Статус заявки ID {order_id} успешно обновлен на {new_status}")
        return {"message": "Статус заявки успешно обновлен", "order_id": order_id, "new_status": order.status}

    except HTTPException as http_exc:
        logger.error(f"Ошибка при обновлении статуса заявки ID {order_id}: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        await db.rollback()
        logger.error(f"Неизвестная ошибка при обновлении статуса заявки ID {order_id}: {e}")
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")
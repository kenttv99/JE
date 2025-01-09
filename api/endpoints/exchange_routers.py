from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from database.init_db import ExchangeRate, get_async_db
from typing import List
from api.endpoints.garantex_api import fetch_usdt_rub_garantex_rates
from api.schemas import ExchangeRateResponse
import logging
from datetime import datetime


from garantex_api import (
    fetch_usdt_rub_garantex_rates,
    fetch_btc_rub_garantex_rates
)

# Настройка логирования
from config.logging_config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)



router = APIRouter()

@router.get("/health")
async def health_check():
    """Проверка состояния сервера."""
    return {"status": "ok"}

@router.post("/update_rates")
async def update_exchange_rates(db: AsyncSession = Depends(get_async_db)):
    """
    Обновляет курсы USDT/RUB и BTC/RUB из Garantex и сохраняет их в базе данных.
    
    Этот маршрут выполняет следующие действия:
    1. Получает текущие курсы для USDT и BTC с помощью функций из `garantex_api`.
    2. Обновляет существующие записи в базе данных или создает новые, если таких записей нет.
    3. Возвращает сообщение об успешном обновлении курсов.
    """
    try:
        # Шаг 1: Получаем курсы из Garantex
        usdt_rates = await fetch_usdt_rub_garantex_rates()
        btc_rates = await fetch_btc_rub_garantex_rates()

        if not usdt_rates or not btc_rates:
            logger.error("Не удалось получить некоторые курсы из Garantex")
            raise HTTPException(status_code=500, detail="Ошибка получения курсов из Garantex")

        # Список валют для обновления
        currencies = [
            {"currency": "USDT", "rates": usdt_rates},
            {"currency": "BTC", "rates": btc_rates}
        ]

        for item in currencies:
            currency = item["currency"]
            rates = item["rates"]

            # Проверяем, существует ли уже запись для этой валюты
            stmt = select(ExchangeRate).where(ExchangeRate.currency == currency)
            result = await db.execute(stmt)
            rate_obj = result.scalar_one_or_none()

            if rate_obj:
                # Обновляем существующую запись
                rate_obj.buy_rate = rates["buy_rate"]
                rate_obj.sell_rate = rates["sell_rate"]
                rate_obj.source = rates.get("source", "Garantex")  # Используем источник по умолчанию, если не указан
                rate_obj.updated_at = datetime.utcnow()
                logger.info(f"Курсы {currency}/RUB обновлены в базе данных")
            else:
                # Создаем новую запись
                new_rate = ExchangeRate(
                    currency=currency,
                    buy_rate=rates["buy_rate"],
                    sell_rate=rates["sell_rate"],
                    source=rates.get("source", "Garantex"),
                    updated_at=datetime.utcnow()
                )
                db.add(new_rate)
                logger.info(f"Курсы {currency}/RUB добавлены в базу данных")

        # Шаг 3: Сохраняем все изменения в базе данных
        await db.commit()

        return {"message": "Курсы успешно обновлены"}

    except HTTPException as http_exc:
        logger.error(f"HTTP ошибка при обновлении курсов: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        await db.rollback()
        logger.error(f"Неожиданная ошибка при обновлении курсов: {e}")
        raise HTTPException(status_code=500, detail="Ошибка обновления курсов")

@router.get("/get_rates", response_model=List[ExchangeRateResponse])
async def get_exchange_rates(db: AsyncSession = Depends(get_async_db)):
    """Получение текущих курсов обмена валют."""
    result = await db.execute(select(ExchangeRate))
    rates = result.scalars().all()
    if not rates:
        raise HTTPException(status_code=404, detail="Курсы не найдены")
    return rates
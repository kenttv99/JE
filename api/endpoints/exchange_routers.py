# api/endpoints/exchange_routers.py

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from datetime import datetime
from typing import List

from database.init_db import ExchangeRate, get_async_db
from .garantex_api import (
    fetch_usdt_rub_garantex_rates,
    fetch_btc_rub_garantex_rates
)
from api.schemas import ExchangeRateResponse

router = APIRouter()

@router.get("/health")
async def health_check():
    """Проверка состояния сервера."""
    return {"status": "ok"}

@router.post("/update_rates")
async def update_exchange_rates(db: AsyncSession = Depends(get_async_db)):
    """Обновление курсов обмена валют для USDT и BTC."""
    try:
        # Шаг 1: Получаем курсы USDT/RUB и BTC/RUB из Garantex
        usdt_rates = await fetch_usdt_rub_garantex_rates()
        btc_rates = await fetch_btc_rub_garantex_rates()

        if not usdt_rates or not btc_rates:
            raise HTTPException(status_code=500, detail="Не удалось получить курсы с Garantex")

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
                rate_obj.source = rates.get("source", "Garantex")
                rate_obj.updated_at = datetime.utcnow()
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

        # Шаг 2: Сохраняем все изменения в базе данных
        await db.commit()

        return {"message": "Курсы успешно обновлены"}

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка обновления курсов: {str(e)}")

@router.get("/get_rates", response_model=List[ExchangeRateResponse])
async def get_exchange_rates(db: AsyncSession = Depends(get_async_db)):
    """Получение текущих курсов обмена валют."""
    try:
        result = await db.execute(select(ExchangeRate))
        rates = result.scalars().all()
        if not rates:
            raise HTTPException(status_code=404, detail="Курсы не найдены")
        return rates
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка получения курсов")
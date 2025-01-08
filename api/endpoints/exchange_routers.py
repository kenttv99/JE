from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select  # Добавляем импорт select
from sqlalchemy import delete
from database.init_db import ExchangeRate, get_async_db
from typing import List
from api.endpoints.garantex_api import fetch_garantex_rates
from api.schemas import ExchangeRateResponse

router = APIRouter()

@router.get("/health")
async def health_check():
    """Проверка состояния сервера."""
    return {"status": "ok"}

@router.post("/update_rates")
async def update_exchange_rates(db: AsyncSession = Depends(get_async_db)):
    """Обновление курсов обмена валют."""
    rates = await fetch_garantex_rates()
    if not rates:
        raise HTTPException(status_code=500, detail="Не удалось получить курсы с Garantex")

    await db.execute(delete(ExchangeRate))  # Удаление старых записей
    new_rate = ExchangeRate(
        currency="USDT",
        buy_rate=rates["buy_rate"],
        sell_rate=rates["sell_rate"],
        source="Garantex"
    )
    db.add(new_rate)
    await db.commit()
    return {"message": "Курсы успешно обновлены"}

@router.get("/get_rates", response_model=List[ExchangeRateResponse])
async def get_exchange_rates(db: AsyncSession = Depends(get_async_db)):
    """Получение текущих курсов обмена валют."""
    result = await db.execute(select(ExchangeRate))
    rates = result.scalars().all()
    if not rates:
        raise HTTPException(status_code=404, detail="Курсы не найдены")
    return rates
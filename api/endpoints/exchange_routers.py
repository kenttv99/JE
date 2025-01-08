from fastapi import APIRouter, HTTPException, Depends
from datetime import timedelta, datetime
from sqlalchemy.orm import Session
from database.init_db import ExchangeOrder, OrderStatus, ExchangeRate
from typing import List
from api.endpoints.garantex_api import fetch_garantex_rates
from api.schemas import ExchangeRateResponse
from api.utils.user_utils import get_db  # Исправленный импорт

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Проверка здоровья сервера.
    """
    return {"status": "ok"}

@router.post("/update_rates")
async def update_exchange_rates(db: Session = Depends(get_db)):
    """
    Обновление курсов в базе данных с Garantex.
    """
    rates = fetch_garantex_rates()
    if not rates:
        raise HTTPException(status_code=500, detail="Не удалось получить курсы с Garantex")

    db.query(ExchangeRate).delete()  # Удаление старых записей
    new_rate = ExchangeRate(
        currency="USDT",
        buy_rate=rates["buy_rate"],
        sell_rate=rates["sell_rate"],
        source="Garantex",
        rate=(rates["buy_rate"] + rates["sell_rate"]) / 2,  # Пример вычисления среднего курса
        timestamp=datetime.utcnow()  # Устанавливаем текущую временную метку
    )
    db.add(new_rate)
    db.commit()
    return {"message": "Курсы успешно обновлены"}

@router.get("/get_rates", response_model=List[ExchangeRateResponse])
async def get_exchange_rates(db: Session = Depends(get_db)):
    """
    Получение курсов из базы данных.
    """
    rates = db.query(ExchangeRate).all()
    if not rates:
        raise HTTPException(status_code=404, detail="Курсы не найдены")
    return rates
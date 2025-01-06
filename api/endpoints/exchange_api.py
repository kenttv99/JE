from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database.init_db import SessionLocal, ExchangeOrder, OrderStatus, ExchangeRate
from typing import List
from api.endpoints.garantex_api import fetch_garantex_rates
from api.schemas import ExchangeRateResponse  # Импортируем схемы из schemas.py

router = APIRouter()

# Подключение к базе данных через зависимость
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Проверка здоровья сервера
@router.get("/health")
async def health_check():
    return {"status": "ok"}

# Обновление курсов
@router.post("/update_rates")
async def update_exchange_rates(db: Session = Depends(get_db)):
    rates = fetch_garantex_rates()
    if not rates:
        raise HTTPException(status_code=500, detail="Не удалось получить курсы с Garantex")

    # Обновление курсов в базе данных
    db.query(ExchangeRate).delete()  # Удаляем старые записи
    new_rate = ExchangeRate(
        currency="USDT",
        buy_rate=rates["buy_rate"],
        sell_rate=rates["sell_rate"],
        source="Garantex"
    )
    db.add(new_rate)
    db.commit()
    return {"message": "Курсы успешно обновлены"}

# Получение курсов
@router.get("/get_rates", response_model=List[ExchangeRateResponse])
async def get_exchange_rates(db: Session = Depends(get_db)):
    rates = db.query(ExchangeRate).all()
    if not rates:
        raise HTTPException(status_code=404, detail="Курсы не найдены")
    return rates
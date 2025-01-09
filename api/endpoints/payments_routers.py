# api/endpoints/payments_routers.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from api.schemas import PaymentMethodCreate, PaymentMethodResponse
from database.init_db import get_async_db, PaymentMethod

router = APIRouter()

@router.post("/", response_model=PaymentMethodResponse)
async def create_payment_method(payment_method: PaymentMethodCreate, db: AsyncSession = Depends(get_async_db)):
    """
    Создание нового метода оплаты.
    """
    db_payment_method = PaymentMethod(
        payment_method=payment_method.payment_method,
        bank=payment_method.bank,
        payment_details=payment_method.payment_details,
        can_buy=payment_method.can_buy,
        can_sell=payment_method.can_sell,
        fee_percentage=payment_method.fee_percentage
    )
    db.add(db_payment_method)
    await db.commit()
    await db.refresh(db_payment_method)
    return db_payment_method

@router.get("/", response_model=List[PaymentMethodResponse])
async def read_payment_methods(skip: int = 0, limit: int = 10, db: AsyncSession = Depends(get_async_db)):
    """
    Получение списка методов оплаты с пагинацией.
    """
    result = await db.execute(
        PaymentMethod.__table__.select().offset(skip).limit(limit)
    )
    payment_methods = result.scalars().all()
    return payment_methods

@router.get("/{payment_method_id}", response_model=PaymentMethodResponse)
async def read_payment_method(payment_method_id: int, db: AsyncSession = Depends(get_async_db)):
    """
    Получение метода оплаты по ID.
    """
    result = await db.execute(
        PaymentMethod.__table__.select().where(PaymentMethod.id == payment_method_id)
    )
    payment_method = result.fetchone()
    if payment_method is None:
        raise HTTPException(status_code=404, detail="Метод оплаты не найден")
    return payment_method

@router.put("/{payment_method_id}", response_model=PaymentMethodResponse)
async def update_payment_method(payment_method_id: int, payment_method: PaymentMethodCreate, db: AsyncSession = Depends(get_async_db)):
    """
    Обновление существующего метода оплаты.
    """
    result = await db.execute(
        PaymentMethod.__table__.select().where(PaymentMethod.id == payment_method_id)
    )
    db_payment_method = result.fetchone()
    if db_payment_method is None:
        raise HTTPException(status_code=404, detail="Метод оплаты не найден")
    
    # Обновление полей метода оплаты
    update_data = payment_method.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_payment_method, key, value)
    
    db.add(db_payment_method)
    await db.commit()
    await db.refresh(db_payment_method)
    return db_payment_method

@router.delete("/{payment_method_id}", response_model=PaymentMethodResponse)
async def delete_payment_method(payment_method_id: int, db: AsyncSession = Depends(get_async_db)):
    """
    Удаление метода оплаты по ID.
    """
    result = await db.execute(
        PaymentMethod.__table__.select().where(PaymentMethod.id == payment_method_id)
    )
    db_payment_method = result.fetchone()
    if db_payment_method is None:
        raise HTTPException(status_code=404, detail="Метод оплаты не найден")
    
    await db.execute(
        PaymentMethod.__table__.delete().where(PaymentMethod.id == payment_method_id)
    )
    await db.commit()
    return db_payment_method
# api/endpoints/payments_routers.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from api.schemas import PaymentCreate, PaymentResponse, PaymentUpdate
from database.init_db import get_async_db, Payment, ExchangeOrder
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio

router = APIRouter()

@router.post("/", response_model=PaymentResponse)
async def create_payment(payment: PaymentCreate, db: AsyncSession = Depends(get_async_db)):
    # Проверка существования заказа
    result = await db.execute(
        ExchangeOrder.__table__.select().where(ExchangeOrder.id == payment.order_id)
    )
    order = result.fetchone()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Создание нового платежа с новыми полями
    db_payment = Payment(
        order_id=payment.order_id,
        payment_method=payment.payment_method,
        bank=payment.bank,
        payment_details=payment.payment_details,
        can_buy=payment.can_buy,
        can_sell=payment.can_sell,
        fee_percentage=payment.fee_percentage
    )
    db.add(db_payment)
    await db.commit()
    await db.refresh(db_payment)
    return db_payment

@router.get("/", response_model=List[PaymentResponse])
async def read_payments(skip: int = 0, limit: int = 10, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(
        Payment.__table__.select().offset(skip).limit(limit)
    )
    payments = result.scalars().all()
    return payments

@router.get("/{payment_id}", response_model=PaymentResponse)
async def read_payment(payment_id: int, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(
        Payment.__table__.select().where(Payment.id == payment_id)
    )
    payment = result.fetchone()
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(payment_id: int, payment: PaymentUpdate, db: AsyncSession = Depends(get_async_db)):
    # Поиск платежа по ID
    result = await db.execute(
        Payment.__table__.select().where(Payment.id == payment_id)
    )
    db_payment = result.fetchone()
    if db_payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Преобразование rowproxy в dict для обновления
    update_data = payment.dict(exclude_unset=True)
    
    # Обновление полей платежа
    for key, value in update_data.items():
        setattr(db_payment, key, value)
    
    db.add(db_payment)
    await db.commit()
    await db.refresh(db_payment)
    return db_payment

@router.delete("/{payment_id}", response_model=PaymentResponse)
async def delete_payment(payment_id: int, db: AsyncSession = Depends(get_async_db)):
    # Поиск платежа по ID
    result = await db.execute(
        Payment.__table__.select().where(Payment.id == payment_id)
    )
    db_payment = result.fetchone()
    if db_payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Удаление платежа
    await db.execute(
        Payment.__table__.delete().where(Payment.id == payment_id)
    )
    await db.commit()
    return db_payment
# api/endpoints/payments_routers.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlalchemy import select

from api.schemas import PaymentMethodSchema
from database.init_db import get_async_db, PaymentMethod

router = APIRouter()

@router.get("/", response_model=List[PaymentMethodSchema])  # Изменяем схему ответа
async def read_payment_methods(skip: int = 0, limit: int = 10, db: AsyncSession = Depends(get_async_db)):
    """
    Получение списка методов оплаты с пагинацией.
    """
    from sqlalchemy import select  # Добавляем импорт
    
    try:
        # Используем select вместо прямого обращения к __table__
        stmt = select(PaymentMethod).offset(skip).limit(limit)
        result = await db.execute(stmt)
        payment_methods = result.scalars().all()
        
        return payment_methods
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении методов оплаты: {str(e)}"
        )
        

@router.post("/", response_model=PaymentMethodSchema)
async def create_payment_method(
    payment_method: PaymentMethodSchema, 
    db: AsyncSession = Depends(get_async_db)
):
    """
    Создание нового метода оплаты.
    """
    try:
        db_payment_method = PaymentMethod(
            method_name=payment_method.method_name,
            description=payment_method.description
        )
        db.add(db_payment_method)
        await db.commit()
        await db.refresh(db_payment_method)
        return db_payment_method
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при создании метода оплаты: {str(e)}"
        )

@router.get("/{payment_method_id}", response_model=PaymentMethodSchema)
async def read_payment_method(
    payment_method_id: int, 
    db: AsyncSession = Depends(get_async_db)
):
    """
    Получение метода оплаты по ID.
    """
    try:
        stmt = select(PaymentMethod).where(PaymentMethod.id == payment_method_id)
        result = await db.execute(stmt)
        payment_method = result.scalars().first()
        
        if payment_method is None:
            raise HTTPException(status_code=404, detail="Метод оплаты не найден")
        
        return payment_method
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении метода оплаты: {str(e)}"
        )
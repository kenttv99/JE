import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from database.init_db import get_async_db, PaymentMethodTrader
from api.schemas import TraderMethodCreateRequest, TraderMethodResponse


router = APIRouter()

@router.post("/", response_model=TraderMethodResponse)
async def create_trader_method(
    method: TraderMethodCreateRequest, 
    db: AsyncSession = Depends(get_async_db)
):
    """
    Create a new trader method.
    """
    try:
        new_method = PaymentMethodTrader(name=method.name, details=method.details)
        db.add(new_method)
        await db.commit()
        await db.refresh(new_method)
        return new_method
    except Exception as e:
        await db.rollback()
        logging.error(f"Error creating trader method: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/", response_model=List[TraderMethodResponse])
async def get_trader_methods(db: AsyncSession = Depends(get_async_db)):
    """
    Get all trader methods.
    """
    try:
        result = await db.execute(select(PaymentMethodTrader))
        methods = result.scalars().all()
        return methods
    except Exception as e:
        logging.error(f"Error fetching trader methods: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
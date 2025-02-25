import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime

from database.init_db import get_async_db, PaymentMethodTrader, BanksTrader
from api.schemas import (
    TraderMethodCreateRequest, 
    TraderMethodResponse,
    BanksTraderResponse
)

router = APIRouter()

@router.post("/add_method", response_model=TraderMethodResponse)
async def create_trader_method(
    method: TraderMethodCreateRequest, 
    db: AsyncSession = Depends(get_async_db)
):
    """
    Create a new trader method.
    """
    try:
        # Check if method with the same name already exists
        result = await db.execute(select(PaymentMethodTrader).where(PaymentMethodTrader.method_name == method.name))
        existing_method = result.scalar_one_or_none()
        
        if existing_method:
            raise HTTPException(status_code=400, detail=f"Method with name '{method.name}' already exists")
        
        new_method = PaymentMethodTrader(
            method_name=method.name, 
            description=method.details
        )
        db.add(new_method)
        await db.commit()
        await db.refresh(new_method)
        return TraderMethodResponse(
            id=new_method.id,
            method_name=new_method.method_name.value,
            details=new_method.description
        )
    except HTTPException as http_exc:
        await db.rollback()
        raise http_exc
    except Exception as e:
        await db.rollback()
        logging.error(f"Error creating trader method: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/get_methods", response_model=List[TraderMethodResponse])
async def get_trader_methods(db: AsyncSession = Depends(get_async_db)):
    """
    Get all trader methods.
    """
    try:
        result = await db.execute(select(PaymentMethodTrader))
        methods = result.scalars().all()
        return [
            TraderMethodResponse(
                id=method.id,
                method_name=method.method_name.value,
                description=method.description
            ) for method in methods
        ]
    except Exception as e:
        logging.error(f"Error fetching trader methods: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/{method_name}/banks", response_model=List[BanksTraderResponse])
async def get_banks_by_method(
    method_name: str,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get banks for a specific payment method.
    """
    try:
        result = await db.execute(
            select(BanksTrader).where(BanksTrader.method_name == method_name)
        )
        banks = result.scalars().all()
        if not banks:
            raise HTTPException(
                status_code=404,
                detail="Banks not found for the specified method"
            )
        return banks
    except Exception as e:
        logging.error(f"Error fetching banks: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.delete("/delete_method/{method_id}", response_model=dict)
async def delete_trader_method(
    method_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Delete a trader method.
    """
    try:
        result = await db.execute(select(PaymentMethodTrader).where(PaymentMethodTrader.id == method_id))
        method = result.scalar_one_or_none()
        
        if not method:
            raise HTTPException(status_code=404, detail="Method not found")
        
        await db.delete(method)
        await db.commit()
        return {"message": "Method deleted successfully"}
    except HTTPException as http_exc:
        await db.rollback()
        raise http_exc
    except Exception as e:
        await db.rollback()
        logging.error(f"Error deleting trader method: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
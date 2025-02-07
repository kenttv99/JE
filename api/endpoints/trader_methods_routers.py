import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime

from database.init_db import get_async_db, PaymentMethodTrader
from api.schemas import TraderMethodCreateRequest, TraderMethodResponse

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
            method_name=new_method.method_name.value,  # Convert Enum to string
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
                method_name=method.method_name.value,  # Convert Enum to string
                details=method.description
            ) for method in methods
        ]
    except Exception as e:
        logging.error(f"Error fetching trader methods: {e}")
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
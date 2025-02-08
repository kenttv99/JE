import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime

from database.init_db import get_async_db, ReqTrader
from api.schemas import ReqTraderCreate, ReqTraderResponse, ReqTraderUpdate
from api.auth import get_current_trader

router = APIRouter()

@router.post("/add_requisite", response_model=ReqTraderResponse)
async def create_trader_requisite(
    requisite: ReqTraderCreate, 
    db: AsyncSession = Depends(get_async_db),
    current_trader: dict = Depends(get_current_trader)
):
    """
    Create a new trader requisite.
    """
    try:
        new_requisite = ReqTrader(
            trader_id=current_trader.id,
            payment_method=requisite.payment_method,
            bank=requisite.bank,
            payment_details=requisite.payment_details,
            status=requisite.status,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_requisite)
        await db.commit()
        await db.refresh(new_requisite)
        return ReqTraderResponse(
            id=new_requisite.id,
            trader_id=new_requisite.trader_id,
            payment_method=new_requisite.payment_method,
            bank=new_requisite.bank,
            payment_details=new_requisite.payment_details,
            status=new_requisite.status,
            created_at=new_requisite.created_at,
            updated_at=new_requisite.updated_at
        )
    except Exception as e:
        await db.rollback()
        logging.error(f"Error creating trader requisite: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/all_requisites", response_model=List[ReqTraderResponse])
async def get_trader_requisites(db: AsyncSession = Depends(get_async_db)):
    """
    Get all trader requisites.
    """
    try:
        result = await db.execute(select(ReqTrader))
        requisites = result.scalars().all()
        return [
            ReqTraderResponse(
                id=requisite.id,
                trader_id=requisite.trader_id,
                payment_method=requisite.payment_method,
                bank=requisite.bank,
                payment_details=requisite.payment_details,
                status=requisite.status,
                created_at=requisite.created_at,
                updated_at=requisite.updated_at
            ) for requisite in requisites
        ]
    except Exception as e:
        logging.error(f"Error fetching trader requisites: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.put("/update_requisite/{requisite_id}", response_model=ReqTraderResponse)
async def update_trader_requisite(
    requisite_id: int,
    requisite_update: ReqTraderUpdate,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Update an existing trader requisite.
    """
    try:
        result = await db.execute(select(ReqTrader).where(ReqTrader.id == requisite_id))
        requisite = result.scalar_one_or_none()
        
        if not requisite:
            raise HTTPException(status_code=404, detail="Requisite not found")
        
        for key, value in requisite_update.dict().items():
            setattr(requisite, key, value)
        
        requisite.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(requisite)
        return ReqTraderResponse(
            id=requisite.id,
            trader_id=requisite.trader_id,
            payment_method=requisite.payment_method,
            bank=requisite.bank,
            payment_details=requisite.payment_details,
            status=requisite.status,
            created_at=requisite.created_at,
            updated_at=requisite.updated_at
        )
    except Exception as e:
        await db.rollback()
        logging.error(f"Error updating trader requisite: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.delete("/delete_requisite/{requisite_id}", response_model=ReqTraderResponse)
async def delete_trader_requisite(
    requisite_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Delete a trader requisite.
    """
    try:
        result = await db.execute(select(ReqTrader).where(ReqTrader.id == requisite_id))
        requisite = result.scalar_one_or_none()
        
        if not requisite:
            raise HTTPException(status_code=404, detail="Requisite not found")
        
        await db.delete(requisite)
        await db.commit()
        return requisite
    except Exception as e:
        await db.rollback()
        logging.error(f"Error deleting trader requisite: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
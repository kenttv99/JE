from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from database.init_db import TraderOrder, get_async_db
from api.schemas import TraderOrderResponse, TraderOrderCreate, TraderOrderUpdate
from api.auth import get_current_trader

router = APIRouter()

@router.get("/", response_model=List[TraderOrderResponse])
async def read_trader_orders(skip: int = 0, limit: int = 10, db: AsyncSession = Depends(get_async_db)):
    """
    Endpoint to read trader orders
    """
    result = await db.execute(select(TraderOrder).offset(skip).limit(limit))
    orders = result.scalars().all()
    return orders

@router.post("/", response_model=TraderOrderResponse)
async def create_trader_order(order: TraderOrderCreate, db: AsyncSession = Depends(get_async_db), current_trader: TraderOrder = Depends(get_current_trader)):
    """
    Endpoint to create a new trader order
    """
    db_order = TraderOrder(**order.dict(), trader_id=current_trader.id)
    db.add(db_order)
    await db.commit()
    await db.refresh(db_order)
    return db_order

@router.put("/{order_id}", response_model=TraderOrderResponse)
async def update_trader_order(order_id: int, order: TraderOrderUpdate, db: AsyncSession = Depends(get_async_db)):
    """
    Endpoint to update an existing trader order
    """
    db_order = await db.get(TraderOrder, order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    for key, value in order.dict().items():
        setattr(db_order, key, value)
    await db.commit()
    await db.refresh(db_order)
    return db_order

@router.delete("/{order_id}", response_model=TraderOrderResponse)
async def delete_trader_order(order_id: int, db: AsyncSession = Depends(get_async_db)):
    """
    Endpoint to delete a trader order
    """
    db_order = await db.get(TraderOrder, order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    await db.delete(db_order)
    await db.commit()
    return db_order
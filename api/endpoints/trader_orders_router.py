from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from .. import crud, models, schemas
from database.init_db import ExchangeRate, get_async_db

# Creating a new router for trader orders
router = APIRouter()

@router.get("/", response_model=List[schemas.Order])
async def read_trader_orders(skip: int = 0, limit: int = 10, db: AsyncSession = Depends(get_async_db)):
    """
    Endpoint to read trader orders
    """
    orders = await crud.get_trader_orders(db=db, skip=skip, limit=limit)
    return orders

@router.post("/", response_model=schemas.Order)
async def create_trader_order(order: schemas.OrderCreate, db: AsyncSession = Depends(get_async_db), current_trader: models.Trader = Depends(get_current_trader)):
    """
    Endpoint to create a new trader order
    """
    return await crud.create_trader_order(db=db, order=order, trader_id=current_trader.id)

@router.put("/{order_id}", response_model=schemas.Order)
async def update_trader_order(order_id: int, order: schemas.OrderUpdate, db: AsyncSession = Depends(get_async_db)):
    """
    Endpoint to update an existing trader order
    """
    db_order = await crud.get_order(db=db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return await crud.update_trader_order(db=db, order_id=order_id, order=order)

@router.delete("/{order_id}", response_model=schemas.Order)
async def delete_trader_order(order_id: int, db: AsyncSession = Depends(get_async_db)):
    """
    Endpoint to delete a trader order
    """
    db_order = await crud.get_order(db=db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return await crud.delete_trader_order(db=db, order_id=order_id)
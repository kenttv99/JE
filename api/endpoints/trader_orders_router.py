# api/endpoints/trader_orders_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import logging

from database.init_db import TraderOrder, Trader, get_async_db
from api.schemas import TraderOrderResponse, TraderOrderUpdate
from api.auth import get_current_trader

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[TraderOrderResponse])
async def read_trader_orders(
    skip: int = 0, 
    limit: int = 50, 
    db: AsyncSession = Depends(get_async_db),
    current_trader: Trader = Depends(get_current_trader)
):
    """
    Endpoint to read trader's own orders. Requires trader authentication.
    """
    try:
        # Получаем ордера, связанные с текущим трейдером
        query = select(TraderOrder).filter(TraderOrder.trader_id == current_trader.id)
        
        # Применяем пагинацию
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        orders = result.scalars().all()
        
        logger.info(f"Retrieved {len(orders)} orders for trader_id={current_trader.id}")
        
        return orders
    except Exception as e:
        logger.error(f"Error retrieving trader orders: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving orders: {str(e)}")

@router.get("/{order_id}", response_model=TraderOrderResponse)
async def read_trader_order(
    order_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_trader: Trader = Depends(get_current_trader)
):
    """
    Endpoint to read a specific trader order. Requires trader authentication.
    """
    try:
        # Получаем конкретный ордер
        result = await db.execute(
            select(TraderOrder).filter(
                TraderOrder.id == order_id,
                TraderOrder.trader_id == current_trader.id
            )
        )
        
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return order
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving order {order_id} for trader_id={current_trader.id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving order: {str(e)}")

@router.put("/{order_id}", response_model=TraderOrderResponse)
async def update_trader_order(
    order_id: int, 
    order: TraderOrderUpdate, 
    db: AsyncSession = Depends(get_async_db), 
    current_trader: Trader = Depends(get_current_trader)
):
    """
    Endpoint to update an existing trader order. Requires trader authentication.
    """
    try:
        # Получаем ордер и проверяем, что он принадлежит текущему трейдеру
        result = await db.execute(
            select(TraderOrder).filter(
                TraderOrder.id == order_id,
                TraderOrder.trader_id == current_trader.id
            )
        )
        
        db_order = result.scalar_one_or_none()
        
        if db_order is None:
            raise HTTPException(status_code=404, detail="Order not found")
            
        # Обновляем поля ордера
        for key, value in order.dict(exclude_unset=True).items():
            setattr(db_order, key, value)
            
        await db.commit()
        await db.refresh(db_order)
        
        logger.info(f"Updated order: id={order_id}, trader_id={current_trader.id}, status={db_order.status}")
        
        return db_order
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating trader order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating order: {str(e)}")

@router.delete("/{order_id}", response_model=TraderOrderResponse)
async def delete_trader_order(
    order_id: int, 
    db: AsyncSession = Depends(get_async_db), 
    current_trader: Trader = Depends(get_current_trader)
):
    """
    Endpoint to delete a trader order. Requires trader authentication.
    """
    try:
        # Получаем ордер и проверяем, что он принадлежит текущему трейдеру
        result = await db.execute(
            select(TraderOrder).filter(
                TraderOrder.id == order_id,
                TraderOrder.trader_id == current_trader.id
            )
        )
        
        db_order = result.scalar_one_or_none()
        
        if db_order is None:
            raise HTTPException(status_code=404, detail="Order not found")
            
        # Удаляем ордер
        await db.delete(db_order)
        await db.commit()
        
        logger.info(f"Deleted order: id={order_id}, trader_id={current_trader.id}")
        
        return db_order
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting trader order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting order: {str(e)}")
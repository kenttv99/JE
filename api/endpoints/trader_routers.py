from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlalchemy import select
from database.init_db import get_async_db, Trader
from api.schemas import TraderCreate, TraderResponse
from api.auth import hash_password, get_current_trader

router = APIRouter()

@router.post("/create_trader", response_model=TraderResponse)
async def create_trader(
    trader: TraderCreate,
    db: AsyncSession = Depends(get_async_db)
):
    """Create a new trader"""
    try:
        # Check if trader with this email exists
        stmt = select(Trader).where(Trader.email == trader.email)
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Trader with this email already exists"
            )

        # Create new trader
        db_trader = Trader(
            email=trader.email,
            password_hash=hash_password(trader.password),
            avatar_url=trader.avatar_url,
            verification_level=trader.verification_level,
            referrer_id=trader.referrer_id,
            referrer_percent=trader.referrer_percent,
            pay_in=trader.pay_in,
            pay_out=trader.pay_out,
            access=trader.access
        )
        
        db.add(db_trader)
        await db.commit()
        await db.refresh(db_trader)
        return db_trader

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me", response_model=TraderResponse)
async def get_trader_me(
    current_trader: Trader = Depends(get_current_trader),
):
    """Get current trader's information"""
    return current_trader

@router.get("/{trader_id}", response_model=TraderResponse)
async def get_trader(
    trader_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """Get trader by ID"""
    stmt = select(Trader).where(Trader.id == trader_id)
    result = await db.execute(stmt)
    trader = result.scalar_one_or_none()
    
    if not trader:
        raise HTTPException(status_code=404, detail="Trader not found")
    
    return trader

# Add more endpoints as needed
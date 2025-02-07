import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime

from database.init_db import get_async_db, TraderAddress
from api.schemas import TraderAddressCreate, TraderAddressResponse, TraderAddressStatusUpdate
from api.enums import TraderAddressStatusEnum
from api.auth import get_current_trader  # Use the existing dependency to get the current trader

router = APIRouter()

@router.post("/add_address", response_model=TraderAddressResponse)
async def create_trader_address(
    address: TraderAddressCreate, 
    db: AsyncSession = Depends(get_async_db),
    current_trader: dict = Depends(get_current_trader)  # Get the current authenticated trader
):
    """
    Create a new trader address.
    """
    try:
        new_address = TraderAddress(
            trader_id=current_trader.id,  # Use the trader_id from the authenticated user
            wallet_number=address.wallet_number,
            network=address.network,
            coin=address.coin,
            status=TraderAddressStatusEnum.check  # Default status
        )
        db.add(new_address)
        await db.commit()
        await db.refresh(new_address)
        return TraderAddressResponse(
            id=new_address.id,
            trader_id=new_address.trader_id,
            wallet_number=new_address.wallet_number,
            network=new_address.network,
            coin=new_address.coin,
            status=new_address.status,
            created_at=new_address.created_at,
            updated_at=new_address.updated_at
        )
    except Exception as e:
        await db.rollback()
        logging.error(f"Error creating trader address: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/all_trader_addresses", response_model=List[TraderAddressResponse])
async def get_trader_addresses(db: AsyncSession = Depends(get_async_db)):
    """
    Get all trader addresses.
    """
    try:
        result = await db.execute(select(TraderAddress))
        addresses = result.scalars().all()
        return [
            TraderAddressResponse(
                id=address.id,
                trader_id=address.trader_id,
                wallet_number=address.wallet_number,
                network=address.network,
                coin=address.coin,
                status=address.status,
                created_at=address.created_at,
                updated_at=address.updated_at
            ) for address in addresses
        ]
    except Exception as e:
        logging.error(f"Error fetching trader addresses: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.patch("/update_address_status/{address_id}", response_model=TraderAddressResponse)
async def update_trader_address_status(
    address_id: int,
    status_update: TraderAddressStatusUpdate,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Update the status of a trader address.
    """
    try:
        result = await db.execute(select(TraderAddress).where(TraderAddress.id == address_id))
        address = result.scalar_one_or_none()
        
        if not address:
            raise HTTPException(status_code=404, detail="Address not found")
        
        address.status = status_update.status
        await db.commit()
        await db.refresh(address)
        return TraderAddressResponse(
            id=address.id,
            trader_id=address.trader_id,
            wallet_number=address.wallet_number,
            network=address.network,
            coin=address.coin,
            status=address.status,
            created_at=address.created_at,
            updated_at=address.updated_at
        )
    except Exception as e:
        await db.rollback()
        logging.error(f"Error updating trader address status: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
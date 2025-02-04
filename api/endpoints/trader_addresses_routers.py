# api/endpoints/trader_addresses_router.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
import logging
from typing import List

from database.init_db import get_async_db
from database.init_db import TraderAddress, Trader
from api.auth import get_current_trader
from api.enums import AddressStatusEnum
from api.schemas import TraderAddressCreate, TraderAddressResponse
from config.logging_config import setup_logging

# Setup logging with the correct path
setup_logging()
logger = logging.getLogger("trader_addresses")

router = APIRouter()

@router.post("/add_address", response_model=TraderAddressResponse)
async def create_trader_address(
    address: TraderAddressCreate,
    db: AsyncSession = Depends(get_async_db),
    current_trader: Trader = Depends(get_current_trader)
):
    """Create a new address for the trader."""
    logger.info(f"[{datetime.utcnow()}] Creating new address for trader: {current_trader.email}")
    
    try:
        new_address = TraderAddress(
            trader_id=current_trader.id,
            wallet_number=address.wallet_number,
            network=address.network,
            coin=address.coin,
            status=AddressStatusEnum.check,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(new_address)
        await db.commit()
        await db.refresh(new_address)
        
        logger.info(
            f"[{datetime.utcnow()}] Address created successfully. "
            f"Trader: {current_trader.email}, "
            f"Network: {address.network}, "
            f"Coin: {address.coin}"
        )
        return new_address
        
    except Exception as e:
        await db.rollback()
        logger.error(
            f"[{datetime.utcnow()}] Error creating address. "
            f"Trader: {current_trader.email}, Error: {str(e)}"
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to create trader address"
        )

@router.get("/all_trader_addresses", response_model=List[TraderAddressResponse])
async def get_trader_addresses(
    db: AsyncSession = Depends(get_async_db),
    current_trader: Trader = Depends(get_current_trader)
):
    """Get all addresses for the current trader."""
    logger.info(f"[{datetime.utcnow()}] Fetching addresses for trader: {current_trader.email}")
    
    try:
        stmt = (
            select(TraderAddress)
            .where(TraderAddress.trader_id == current_trader.id)
            .order_by(TraderAddress.updated_at.desc())  # Latest first
        )
        result = await db.execute(stmt)
        addresses = result.scalars().all()
        
        logger.info(
            f"[{datetime.utcnow()}] Successfully fetched addresses. "
            f"Trader: {current_trader.email}, "
            f"Count: {len(addresses)}"
        )
        return addresses
    except Exception as e:
        logger.error(
            f"[{datetime.utcnow()}] Error fetching addresses. "
            f"Trader: {current_trader.email}, Error: {str(e)}"
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch trader addresses"
        )

@router.patch("/{address_id}/update_status")
async def update_address_status(
    address_id: int,
    status: AddressStatusEnum,
    db: AsyncSession = Depends(get_async_db),
    current_trader: Trader = Depends(get_current_trader)
):
    """Update status of a trader's address."""
    logger.info(
        f"[{datetime.utcnow()}] Updating status for address {address_id}. "
        f"Trader: {current_trader.email}, New status: {status.value}"
    )
    
    try:
        stmt = (
            select(TraderAddress)
            .where(
                TraderAddress.id == address_id,
                TraderAddress.trader_id == current_trader.id
            )
        )
        result = await db.execute(stmt)
        address = result.scalar_one_or_none()
        
        if not address:
            logger.warning(
                f"[{datetime.utcnow()}] Address not found. "
                f"ID: {address_id}, Trader: {current_trader.email}"
            )
            raise HTTPException(
                status_code=404,
                detail="Address not found or does not belong to the trader"
            )
        
        address.status = status
        address.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(address)
        
        logger.info(
            f"[{datetime.utcnow()}] Status updated successfully. "
            f"Address: {address_id}, New status: {status.value}"
        )
        return {"message": "Address status updated successfully"}
        
    except HTTPException as http_exc:
        await db.rollback()
        raise http_exc
    except Exception as e:
        await db.rollback()
        logger.error(
            f"[{datetime.utcnow()}] Error updating address status. "
            f"Address: {address_id}, Error: {str(e)}"
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to update address status"
        )

@router.delete("/{address_id}/delete_address")
async def delete_trader_address(
    address_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_trader: Trader = Depends(get_current_trader)
):
    """Delete a trader's address."""
    logger.info(
        f"[{datetime.utcnow()}] Deleting address {address_id}. "
        f"Trader: {current_trader.email}"
    )
    
    try:
        stmt = (
            select(TraderAddress)
            .where(
                TraderAddress.id == address_id,
                TraderAddress.trader_id == current_trader.id
            )
        )
        result = await db.execute(stmt)
        address = result.scalar_one_or_none()
        
        if not address:
            logger.warning(
                f"[{datetime.utcnow()}] Address not found for deletion. "
                f"ID: {address_id}, Trader: {current_trader.email}"
            )
            raise HTTPException(
                status_code=404,
                detail="Address not found or does not belong to the trader"
            )
        
        await db.delete(address)
        await db.commit()
        
        logger.info(
            f"[{datetime.utcnow()}] Address deleted successfully. "
            f"ID: {address_id}, Trader: {current_trader.email}"
        )
        return {"message": "Address deleted successfully"}
        
    except HTTPException as http_exc:
        await db.rollback()
        raise http_exc
    except Exception as e:
        await db.rollback()
        logger.error(
            f"[{datetime.utcnow()}] Error deleting address. "
            f"ID: {address_id}, Error: {str(e)}"
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to delete address"
        )
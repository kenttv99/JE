from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
import logging

from database.init_db import TimeZone, Trader, get_async_db
from api.auth import get_current_trader

# Setup logging
from config.logging_config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/timezones")
async def get_timezones(db: AsyncSession = Depends(get_async_db)):
    """Get all available time zones."""
    try:
        result = await db.execute(select(TimeZone).order_by(TimeZone.utc_offset))
        time_zones = result.scalars().all()
        
        return [
            {
                "id": tz.id,
                "name": tz.name,
                "display_name": tz.display_name,
                "utc_offset": tz.utc_offset,
                "regions": tz.regions
            }
            for tz in time_zones
        ]
    except Exception as e:
        logger.error(f"Error fetching time zones: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching time zones")

@router.get("/trader/timezone")
async def get_trader_timezone(
    current_trader: Trader = Depends(get_current_trader),
    db: AsyncSession = Depends(get_async_db)
):
    """Get current trader's time zone."""
    try:
        result = await db.execute(
            select(Trader)
            .options(joinedload(Trader.time_zone))
            .filter(Trader.id == current_trader.id)
        )
        trader = result.scalar_one_or_none()
        
        if not trader:
            raise HTTPException(status_code=404, detail="Trader not found")
        if not trader.time_zone:
            raise HTTPException(status_code=404, detail="Time zone not set for trader")
            
        return {
            "id": trader.time_zone.id,
            "name": trader.time_zone.name,
            "display_name": trader.time_zone.display_name,
            "utc_offset": trader.time_zone.utc_offset,
            "regions": trader.time_zone.regions
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching trader time zone: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching trader time zone")

@router.put("/trader/timezone/{timezone_id}")
async def update_trader_timezone(
    timezone_id: int,
    current_trader: Trader = Depends(get_current_trader),
    db: AsyncSession = Depends(get_async_db)
):
    """Update trader's time zone."""
    try:
        # Verify time zone exists
        tz_result = await db.execute(select(TimeZone).filter(TimeZone.id == timezone_id))
        time_zone = tz_result.scalar_one_or_none()
        
        if not time_zone:
            raise HTTPException(status_code=404, detail="Time zone not found")
            
        # Update trader's time zone
        current_trader.time_zone_id = timezone_id
        await db.commit()
        
        return {"message": "Time zone updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating trader time zone: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating trader time zone")
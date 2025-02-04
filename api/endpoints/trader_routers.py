# api/endpoints/trader_routers.py
from datetime import timedelta
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload

from api.auth import (
    create_access_token,
    verify_password,
    hash_password,
    get_current_trader
)
from database.init_db import TimeZone, Trader, get_async_db
from api.schemas import (
    TraderLoginRequest,
    TraderRegisterRequest,
    TraderUpdateRequest,
    ChangePasswordRequest,
    TraderDetailedResponse
)
from constants import ACCESS_TOKEN_EXPIRE_MINUTES

# Setup logging
from config.logging_config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/register")
async def register_trader(request: TraderRegisterRequest, db: AsyncSession = Depends(get_async_db)):
    """Register a new trader with default Moscow time zone."""
    logger.info("Registering trader with email: %s", request.email)
    
    try:
        # Check if trader exists
        result = await db.execute(select(Trader).filter(Trader.email == request.email))
        existing_trader = result.scalars().first()
        if existing_trader:
            logger.warning("Registration failed: email %s already registered", request.email)
            raise HTTPException(status_code=400, detail="Email already registered")

        # Get Moscow time zone
        moscow_tz_result = await db.execute(
            select(TimeZone).where(TimeZone.name == "Europe/Moscow")
        )
        moscow_tz = moscow_tz_result.scalar_one_or_none()
        
        if not moscow_tz:
            logger.error("Moscow time zone not found")
            raise HTTPException(status_code=500, detail="System configuration error")

        # Hash password
        hashed_password = hash_password(request.password)
        
        # Create new trader with Moscow time zone
        new_trader = Trader(
            email=request.email,
            password_hash=hashed_password,
            verification_level=0,
            time_zone_id=moscow_tz.id,  # Set Moscow time zone
            pay_in=False,
            pay_out=False,
            access=True
        )
        
        db.add(new_trader)
        await db.commit()
        await db.refresh(new_trader)
        
        logger.info("Trader %s successfully registered", request.email)
        return {"message": "Trader successfully registered"}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error("Error registering trader %s: %s", request.email, str(e))
        raise HTTPException(status_code=500, detail="Error registering trader")

@router.post("/login")
async def login_trader(request: TraderLoginRequest, db: AsyncSession = Depends(get_async_db)):
    """Authenticate a trader."""
    try:
        # Get trader by email
        result = await db.execute(
            select(Trader).filter(Trader.email == request.email)
        )
        trader = result.scalars().first()
        
        if not trader:
            raise HTTPException(
                status_code=401, 
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(request.password, trader.password_hash):
            raise HTTPException(
                status_code=401, 
                detail="Invalid email or password"
            )

        # Check if trader has access
        if not trader.access:
            raise HTTPException(
                status_code=403,
                detail="Trader account is disabled"
            )

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": trader.email, "type": "trader"}, 
            expires_delta=access_token_expires
        )
        
        # Updated response to include all fields matching the frontend interface
        return JSONResponse(
            content={
                "trader": {
                    "id": str(trader.id),
                    "email": trader.email,
                    "verification_level": trader.verification_level,
                    "pay_in": trader.pay_in,
                    "pay_out": trader.pay_out,
                    "access": trader.access,  # Added this field
                    "created_at": str(trader.created_at) if trader.created_at else None,  # Added this field
                    "updated_at": str(trader.updated_at) if trader.updated_at else None   # Added this field
                },
                "token": access_token,
                "message": "Login successful"
            },
            status_code=200
        )
    
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/profile", response_model=TraderDetailedResponse)
async def get_trader_profile(
    current_trader: Trader = Depends(get_current_trader),
    db: AsyncSession = Depends(get_async_db)
):
    """Get current trader's detailed profile."""
    try:
        # Get trader with time zone information
        result = await db.execute(
            select(Trader)
            .options(joinedload(Trader.time_zone))
            .filter(Trader.id == current_trader.id)
        )
        trader = result.scalar_one_or_none()
        
        if not trader:
            raise HTTPException(status_code=404, detail="Trader not found")

        return TraderDetailedResponse(
            id=trader.id,
            email=trader.email,
            verification_level=trader.verification_level,
            time_zone_id=trader.time_zone_id,
            time_zone_name=trader.time_zone.name if trader.time_zone else None,
            time_zone_offset=trader.time_zone.utc_offset if trader.time_zone else None,
            pay_in=trader.pay_in,
            pay_out=trader.pay_out,
            access=trader.access,
            created_at=trader.created_at,
            updated_at=trader.updated_at
        )
    except Exception as e:
        logger.error(f"Error fetching trader profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching trader profile")
    
@router.put("/change_password")
async def change_trader_password(
    request: ChangePasswordRequest,
    current_trader: Trader = Depends(get_current_trader),
    db: AsyncSession = Depends(get_async_db)
):
    """Change trader's password."""
    if not verify_password(request.current_password, current_trader.password_hash):
        raise HTTPException(status_code=401, detail="Invalid current password")

    current_trader.password_hash = hash_password(request.new_password)
    try:
        await db.commit()
        return {"message": "Password changed successfully"}
    except Exception as e:
        await db.rollback()
        logger.error(f"Password change error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error changing password")
from datetime import timedelta
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from decimal import Decimal

from api.auth import (
    create_access_token,
    verify_password,
    hash_password,
    get_current_trader
)
from database.init_db import (
    TimeZone, 
    Trader, 
    BalanceTrader,
    FiatCurrencyTrader,
    get_async_db
)
from api.schemas import (
    TraderLoginRequest,
    TraderRegisterRequest,
    TraderUpdateRequest,
    ChangePasswordRequest,
    TraderDetailedResponse
)
from api.enums import TraderVerificationLevelEnum, TraderFiatEnum
from constants import ACCESS_TOKEN_EXPIRE_MINUTES

# Setup logging
from config.logging_config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/register")
async def register_trader(request: TraderRegisterRequest, db: AsyncSession = Depends(get_async_db)):
    """Register a new trader with default Moscow time zone and initial RUB balance."""
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

        # Get default RUB currency
        rub_currency_result = await db.execute(
            select(FiatCurrencyTrader).where(FiatCurrencyTrader.currency_name == TraderFiatEnum.RUB.value)
        )
        rub_currency = rub_currency_result.scalar_one_or_none()
        
        if not rub_currency:
            logger.error("Default RUB currency not found")
            raise HTTPException(status_code=500, detail="System configuration error")

        # Hash password
        hashed_password = hash_password(request.password)
        
        # Create new trader with Moscow time zone and RUB as default currency
        new_trader = Trader(
            email=request.email,
            password_hash=hashed_password,
            verification_level=TraderVerificationLevelEnum.UNVERIFIED,
            time_zone_id=moscow_tz.id,
            pay_in=False,
            pay_out=False,
            access=True,
            fiat_currency_id=rub_currency.id
        )
        
        db.add(new_trader)
        await db.commit()
        await db.refresh(new_trader)

        # Create initial balance for the trader
        initial_balance = BalanceTrader(
            trader_id=new_trader.id,
            fiat=rub_currency.id,
            balance=Decimal('0.00')
        )
        db.add(initial_balance)
        await db.commit()
        
        logger.info("Trader %s successfully registered with initial balance", request.email)
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
        # Get trader by email with balance information
        result = await db.execute(
            select(Trader)
            .options(
                joinedload(Trader.balance_trader),
                joinedload(Trader.fiat_currency)
            )
            .filter(Trader.email == request.email)
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

        # Get balance information
        balance = Decimal('0.00')
        fiat_currency = None
        if trader.balance_trader:
            balance = trader.balance_trader[0].balance if trader.balance_trader else Decimal('0.00')
        if trader.fiat_currency:
            fiat_currency = trader.fiat_currency.currency_name

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": trader.email, "type": "trader"}, 
            expires_delta=access_token_expires
        )
        
        return JSONResponse(
            content={
                "trader": {
                    "id": str(trader.id),
                    "email": trader.email,
                    "verification_level": trader.verification_level.value,
                    "pay_in": trader.pay_in,
                    "pay_out": trader.pay_out,
                    "access": trader.access,
                    "created_at": str(trader.created_at) if trader.created_at else None,
                    "updated_at": str(trader.updated_at) if trader.updated_at else None,
                    "balance": str(balance),
                    "fiat_currency": fiat_currency
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
    """Get current trader's detailed profile including balance."""
    try:
        # Get trader with time zone and balance information
        result = await db.execute(
            select(Trader)
            .options(
                joinedload(Trader.time_zone),
                joinedload(Trader.balance_trader),
                joinedload(Trader.fiat_currency)
            )
            .filter(Trader.id == current_trader.id)
        )
        trader = result.scalar_one_or_none()
        
        if not trader:
            raise HTTPException(status_code=404, detail="Trader not found")

        # Get the balance information
        balance = None
        if trader.balance_trader:
            balance = trader.balance_trader[0].balance if trader.balance_trader else Decimal('0.00')

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
            updated_at=trader.updated_at,
            balance=balance,
            fiat_currency=trader.fiat_currency.currency_name if trader.fiat_currency else None
        )
    except Exception as e:
        logger.error(f"Error fetching trader profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching trader profile")

@router.put("/update_profile")
async def update_trader_profile(
    request: TraderUpdateRequest,
    current_trader: Trader = Depends(get_current_trader),
    db: AsyncSession = Depends(get_async_db)
):
    """Update trader's profile."""
    try:
        # Update only allowed fields
        if request.time_zone_id is not None:
            # Verify time zone exists
            tz_result = await db.execute(
                select(TimeZone).where(TimeZone.id == request.time_zone_id)
            )
            if not tz_result.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Invalid time zone")
            current_trader.time_zone_id = request.time_zone_id

        await db.commit()
        return {"message": "Profile updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Profile update error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating profile")
    
@router.put("/change_password")
async def change_trader_password(
    request: ChangePasswordRequest,
    current_trader: Trader = Depends(get_current_trader),
    db: AsyncSession = Depends(get_async_db)
):
    """Change trader's password."""
    try:
        if not verify_password(request.current_password, current_trader.password_hash):
            raise HTTPException(status_code=401, detail="Invalid current password")

        current_trader.password_hash = hash_password(request.new_password)
        await db.commit()
        return {"message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Password change error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error changing password")
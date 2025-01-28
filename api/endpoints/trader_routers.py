# api/endpoints/trader_auth_routers.py
from datetime import timedelta
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from api.auth import (
    create_access_token,
    verify_password,
    hash_password,
    get_current_trader
)
from database.init_db import Trader, get_async_db
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
    """Register a new trader."""
    logger.info("Registering trader with email: %s", request.email)
    
    # Check if trader already exists
    result = await db.execute(select(Trader).filter(Trader.email == request.email))
    existing_trader = result.scalars().first()
    if existing_trader:
        logger.warning("Registration failed: email %s already registered", request.email)
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed_password = hash_password(request.password)
    
    # Create new trader
    new_trader = Trader(
        email=request.email,
        password_hash=hashed_password,
        verification_level=0,  # Start with basic level
        pay_in=False,  # Default values
        pay_out=False,
        access=True
    )
    db.add(new_trader)
    
    try:
        await db.commit()
        await db.refresh(new_trader)
        logger.info("Trader %s successfully registered", request.email)
        return {"message": "Trader successfully registered"}
    except Exception as e:
        await db.rollback()
        logger.error("Error registering trader %s: %s", request.email, e)
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
        
        return JSONResponse(
            content={
                "trader": {
                    "id": str(trader.id),
                    "email": trader.email,
                    "verification_level": trader.verification_level,
                    "pay_in": trader.pay_in,
                    "pay_out": trader.pay_out
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
async def get_trader_profile(current_trader: Trader = Depends(get_current_trader)):
    """Get current trader's detailed profile."""
    return TraderDetailedResponse(
        id=current_trader.id,
        email=current_trader.email,
        verification_level=current_trader.verification_level,
        pay_in=current_trader.pay_in,
        pay_out=current_trader.pay_out,
        access=current_trader.access,
        created_at=current_trader.created_at,
        updated_at=current_trader.updated_at
    )

@router.put("/profile")
async def update_trader_profile(
    update_data: TraderUpdateRequest,
    current_trader: Trader = Depends(get_current_trader),
    db: AsyncSession = Depends(get_async_db)
):
    """Update trader's profile."""
    try:
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(current_trader, field, value)
        
        await db.commit()
        await db.refresh(current_trader)
        
        return {"message": "Profile updated successfully"}
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
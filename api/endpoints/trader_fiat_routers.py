from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from api.schemas import FiatCurrencyTraderCreate, FiatCurrencyTraderUpdate, FiatCurrencyTraderResponse
from database.init_db import get_session, FiatCurrencyTrader

router = APIRouter()

@router.post("/", response_model=FiatCurrencyTraderResponse, status_code=status.HTTP_201_CREATED)
async def create_fiat_currency_trader(currency: FiatCurrencyTraderCreate, db: AsyncSession = Depends(get_session)):
    new_currency = FiatCurrencyTrader(**currency.dict())
    db.add(new_currency)
    await db.commit()
    await db.refresh(new_currency)
    return new_currency

@router.put("/{currency_id}", response_model=FiatCurrencyTraderResponse)
async def update_fiat_currency_trader(currency_id: int, currency: FiatCurrencyTraderUpdate, db: AsyncSession = Depends(get_session)):
    result = await db.execute(select(FiatCurrencyTrader).filter(FiatCurrencyTrader.id == currency_id))
    existing_currency = result.scalars().first()
    if not existing_currency:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Currency not found")
    
    for key, value in currency.dict().items():
        setattr(existing_currency, key, value)
    
    await db.commit()
    await db.refresh(existing_currency)
    return existing_currency

@router.delete("/{currency_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fiat_currency_trader(currency_id: int, db: AsyncSession = Depends(get_session)):
    result = await db.execute(select(FiatCurrencyTrader).filter(FiatCurrencyTrader.id == currency_id))
    existing_currency = result.scalars().first()
    if not existing_currency:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Currency not found")
    
    await db.delete(existing_currency)
    await db.commit()
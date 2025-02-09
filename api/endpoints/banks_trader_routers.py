from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from api.schemas import BanksTraderCreate, BanksTraderUpdate, BanksTraderResponse
from database.init_db import get_session, BanksTrader

router = APIRouter()

@router.post("/", response_model=BanksTraderResponse, status_code=status.HTTP_201_CREATED)
async def create_bank_trader(bank: BanksTraderCreate, db: AsyncSession = Depends(get_session)):
    new_bank = BanksTrader(**bank.dict())
    db.add(new_bank)
    await db.commit()
    await db.refresh(new_bank)
    return new_bank

@router.put("/{bank_id}", response_model=BanksTraderResponse)
async def update_bank_trader(bank_id: int, bank: BanksTraderUpdate, db: AsyncSession = Depends(get_session)):
    result = await db.execute(select(BanksTrader).filter(BanksTrader.id == bank_id))
    existing_bank = result.scalars().first()
    if not existing_bank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bank not found")
    
    for key, value in bank.dict().items():
        setattr(existing_bank, key, value)
    
    await db.commit()
    await db.refresh(existing_bank)
    return existing_bank

@router.delete("/{bank_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bank_trader(bank_id: int, db: AsyncSession = Depends(get_session)):
    result = await db.execute(select(BanksTrader).filter(BanksTrader.id == bank_id))
    existing_bank = result.scalars().first()
    if not existing_bank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bank not found")
    
    await db.delete(existing_bank)
    await db.commit()
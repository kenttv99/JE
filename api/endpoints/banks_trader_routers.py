from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from api.schemas import BanksTraderCreate, BanksTraderUpdate, BanksTraderResponse
from database.init_db import get_async_db, BanksTrader

router = APIRouter()

@router.post("/", response_model=BanksTraderResponse, status_code=status.HTTP_201_CREATED)
async def create_bank_trader(
    bank: BanksTraderCreate,
    db: AsyncSession = Depends(get_async_db)
):
    try:
        existing_bank = await db.execute(
            select(BanksTrader).where(BanksTrader.bank_name == bank.bank_name)
        )
        if existing_bank.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bank with this name already exists"
            )

        new_bank = BanksTrader(**bank.dict())
        db.add(new_bank)
        await db.commit()
        await db.refresh(new_bank)
        return new_bank
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create bank: {str(e)}"
        )

@router.get("/{bank_id}", response_model=BanksTraderResponse)
async def get_bank_trader(
    bank_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    bank = await db.execute(
        select(BanksTrader).where(BanksTrader.id == bank_id)
    )
    bank = bank.scalar_one_or_none()
    if not bank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank not found"
        )
    return bank

@router.get("/", response_model=List[BanksTraderResponse])
async def list_bank_traders(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_async_db)
):
    banks = await db.execute(
        select(BanksTrader)
        .offset(skip)
        .limit(limit)
    )
    return banks.scalars().all()

@router.put("/{bank_id}", response_model=BanksTraderResponse)
async def update_bank_trader(
    bank_id: int,
    bank: BanksTraderUpdate,
    db: AsyncSession = Depends(get_async_db)
):
    try:
        existing_bank = await db.execute(
            select(BanksTrader).where(BanksTrader.id == bank_id)
        )
        existing_bank = existing_bank.scalar_one_or_none()
        if not existing_bank:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bank not found"
            )

        if bank.bank_name and bank.bank_name != existing_bank.bank_name:
            name_check = await db.execute(
                select(BanksTrader).where(BanksTrader.bank_name == bank.bank_name)
            )
            if name_check.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bank with this name already exists"
                )

        update_data = bank.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(existing_bank, key, value)

        await db.commit()
        await db.refresh(existing_bank)
        return existing_bank
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update bank: {str(e)}"
        )

@router.delete("/{bank_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bank_trader(
    bank_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    try:
        existing_bank = await db.execute(
            select(BanksTrader).where(BanksTrader.id == bank_id)
        )
        existing_bank = existing_bank.scalar_one_or_none()
        if not existing_bank:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bank not found"
            )

        await db.delete(existing_bank)
        await db.commit()
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete bank: {str(e)}"
        )

@router.get("/by-name/{bank_name}", response_model=BanksTraderResponse)
async def get_bank_by_name(
    bank_name: str,
    db: AsyncSession = Depends(get_async_db)
):
    bank = await db.execute(
        select(BanksTrader).where(BanksTrader.bank_name == bank_name)
    )
    bank = bank.scalar_one_or_none()
    if not bank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank not found"
        )
    return bank
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime

from database.init_db import BanksTrader, PaymentMethodTrader, get_async_db, ReqTrader
from api.schemas import ReqTraderCreate, ReqTraderResponse, ReqTraderUpdate
from api.auth import get_current_trader

router = APIRouter()

@router.post("/add_requisite", response_model=ReqTraderResponse)
async def create_trader_requisite(
    requisite: ReqTraderCreate, 
    db: AsyncSession = Depends(get_async_db),
    current_trader: dict = Depends(get_current_trader)
):
    try:
        # Получаем данные банка
        bank_result = await db.execute(
            select(BanksTrader).where(BanksTrader.bank_name == requisite.bank))
        bank = bank_result.scalar_one_or_none()
        if not bank:
            raise HTTPException(status_code=404, detail="Bank not found")

        # Получаем метод оплаты
        method_result = await db.execute(
            select(PaymentMethodTrader)
            .where(PaymentMethodTrader.method_name == requisite.payment_method))
        method = method_result.scalar_one_or_none()
        if not method:
            raise HTTPException(status_code=404, detail="Payment method not found")

        new_requisite = ReqTrader(
            trader_id=current_trader.id,
            payment_method=requisite.payment_method,
            bank=requisite.bank,
            req_number=requisite.req_number,
            fio=requisite.fio,
            status=requisite.status,
            can_buy=requisite.can_buy,
            can_sell=requisite.can_sell,
            bank_description=bank.description,
            payment_method_description=method.description,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_requisite)
        await db.commit()
        await db.refresh(new_requisite)
        return ReqTraderResponse.from_orm(new_requisite)
    except HTTPException as he:
        raise he
    except Exception as e:
        await db.rollback()
        logging.error(f"Error creating trader requisite: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/all_requisites", response_model=List[ReqTraderResponse])
async def get_trader_requisites(db: AsyncSession = Depends(get_async_db)):
    try:
        # Instead of JOINs, we'll fetch all data separately and combine it in Python
        result = await db.execute(select(ReqTrader))
        requisites = result.scalars().all()
        
        # Fetch all banks and methods at once for efficiency
        banks_result = await db.execute(select(BanksTrader))
        banks = {bank.bank_name: bank.description for bank in banks_result.scalars().all()}
        
        methods_result = await db.execute(select(PaymentMethodTrader))
        methods = {str(method.method_name): method.description for method in methods_result.scalars().all()}
        
        return [
            ReqTraderResponse(
                id=requisite.id,
                trader_id=requisite.trader_id,
                payment_method=requisite.payment_method,
                bank=requisite.bank,
                req_number=requisite.req_number,
                fio=requisite.fio,
                status=requisite.status,
                can_buy=requisite.can_buy,
                can_sell=requisite.can_sell,
                # Use existing descriptions or look them up from our fetched data
                bank_description=requisite.bank_description or banks.get(requisite.bank, requisite.bank),
                payment_method_description=requisite.payment_method_description or methods.get(requisite.payment_method, requisite.payment_method),
                created_at=requisite.created_at,
                updated_at=requisite.updated_at
            ) for requisite in requisites
        ]
    except Exception as e:
        logging.error(f"Error fetching trader requisites: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.put("/update_requisite/{requisite_id}", response_model=ReqTraderResponse)
async def update_trader_requisite(
    requisite_id: int,
    requisite_update: ReqTraderUpdate,
    db: AsyncSession = Depends(get_async_db)
):
    try:
        result = await db.execute(select(ReqTrader).where(ReqTrader.id == requisite_id))
        requisite = result.scalar_one_or_none()
        
        if not requisite:
            raise HTTPException(status_code=404, detail="Requisite not found")
        
        update_data = requisite_update.dict(exclude_unset=True)
        
        # If updating only can_buy or can_sell, preserve the existing values.
        # (This business logic may be removed if not desired.)
        if set(update_data.keys()).issubset({'can_buy', 'can_sell'}):
            update_data['payment_method'] = requisite.payment_method
            update_data['bank'] = requisite.bank
            update_data['req_number'] = requisite.req_number
            update_data['fio'] = requisite.fio
            update_data['status'] = requisite.status
        
        # If updating payment method or bank, fetch and update their descriptions too
        if 'payment_method' in update_data:
            method_result = await db.execute(
                select(PaymentMethodTrader)
                .where(PaymentMethodTrader.method_name == update_data['payment_method'])
            )
            method = method_result.scalar_one_or_none()
            if method:
                update_data['payment_method_description'] = method.description
        
        if 'bank' in update_data:
            bank_result = await db.execute(
                select(BanksTrader)
                .where(BanksTrader.bank_name == update_data['bank'])
            )
            bank = bank_result.scalar_one_or_none()
            if bank:
                update_data['bank_description'] = bank.description
        
        for key, value in update_data.items():
            setattr(requisite, key, value)
        
        requisite.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(requisite)
        
        return ReqTraderResponse(
            id=requisite.id,
            trader_id=requisite.trader_id,
            payment_method=requisite.payment_method,
            bank=requisite.bank,
            req_number=requisite.req_number,
            fio=requisite.fio,
            status=requisite.status,
            can_buy=requisite.can_buy,
            can_sell=requisite.can_sell,
            bank_description=requisite.bank_description,
            payment_method_description=requisite.payment_method_description,
            created_at=requisite.created_at,
            updated_at=requisite.updated_at
        )
    except Exception as e:
        await db.rollback()
        logging.error(f"Error updating trader requisite: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
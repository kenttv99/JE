# api/endpoints/merchant_orders_routers.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import logging

from database.init_db import TraderOrder, Trader, ReqTrader, get_async_db
from api.schemas import TraderOrderResponse, TraderOrderCreate
from api.enums import OrderStatus, TraderReqStatus
from decimal import Decimal

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", response_model=TraderOrderResponse)
async def create_merchant_order(
    order: TraderOrderCreate, 
    db: AsyncSession = Depends(get_async_db)
):
    """
    Endpoint for merchants to create a new order for a trader.
    Does not require trader authentication but validates trader's availability and requisite.
    """
    try:
        # Проверяем существование реквизита
        req_result = await db.execute(
            select(ReqTrader).filter(
                ReqTrader.id == order.trader_req_id,
                ReqTrader.status == TraderReqStatus.approve  # Проверяем, что реквизит активен
            )
        )
        
        req = req_result.scalar_one_or_none()
        if not req:
            raise HTTPException(status_code=404, detail="Trader requisite not found or not approved")
        
        # Получаем trader_id из реквизита
        trader_id = req.trader_id
        
        # Проверяем, что trader существует и активен
        trader_result = await db.execute(
            select(Trader).filter(
                Trader.id == trader_id,
                Trader.access == True  # Проверяем, что трейдер активен
            )
        )
        
        trader = trader_result.scalar_one_or_none()
        if not trader:
            raise HTTPException(status_code=400, detail="Trader is not active or not found")
        
        # Проверяем, что trader принимает ордера (pay_in для ордеров на покупку, pay_out для ордеров на продажу)
        if order.order_type.value == "pay_in" and not trader.pay_in:
            raise HTTPException(status_code=400, detail="Trader is not accepting pay-in orders")
        if order.order_type.value == "pay_out" and not trader.pay_out:
            raise HTTPException(status_code=400, detail="Trader is not accepting pay-out orders")
        
        # Проверяем, что реквизит может использоваться для данного типа ордера
        if order.order_type.value == "pay_in" and not req.can_sell:
            raise HTTPException(status_code=400, detail="This requisite cannot be used for pay-in orders")
        if order.order_type.value == "pay_out" and not req.can_buy:
            raise HTTPException(status_code=400, detail="This requisite cannot be used for pay-out orders")
        
        # Создаем ордер
        # Расчет median_rate (в реальном приложении это может быть получено из сервиса обмена валют)
        median_rate = order.total_fiat / order.amount_currency if order.amount_currency != 0 else Decimal('0')
        
        db_order = TraderOrder(
            trader_id=trader_id,
            trader_req_id=order.trader_req_id,
            order_type=order.order_type,
            currency=order.currency,
            fiat=order.fiat,
            amount_currency=order.amount_currency,
            total_fiat=order.total_fiat,
            median_rate=median_rate,
            status=OrderStatus.pending,
            payment_method_id=order.payment_method_id
        )
        
        db.add(db_order)
        await db.commit()
        await db.refresh(db_order)
        
        logger.info(f"Merchant created new order: id={db_order.id}, trader_id={trader_id}, type={order.order_type}")
        
        return db_order
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating merchant order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating order: {str(e)}")
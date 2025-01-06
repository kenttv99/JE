from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum


# Enums
class OrderStatusEnum(str, Enum):
    pending = "pending"
    waiting_access = "waiting_access"
    processing = "processing"
    arbitrage = "arbitrage"
    completed = "completed"
    canceled = "canceled"


class OrderTypeEnum(str, Enum):
    buy = "buy"
    sell = "sell"


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime
    referral_code: Optional[str] = None
    referred_by: Optional[str] = None

    class Config:
        from_attributes = True


# Referral Schemas
class ReferralData(BaseModel):
    referred_users: List[UserResponse]
    bonus_earned: Decimal


# Exchange Order Schemas
class ExchangeOrderBase(BaseModel):
    order_type: OrderTypeEnum
    currency: str
    amount: Decimal
    total_rub: Decimal


class ExchangeOrderCreate(ExchangeOrderBase):
    pass


class ExchangeOrderResponse(ExchangeOrderBase):
    id: int
    user_id: int
    status: OrderStatusEnum
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Payment Schemas
class PaymentBase(BaseModel):
    payment_method: str
    bank: str
    payment_details: str


class PaymentCreate(PaymentBase):
    order_id: int


class PaymentResponse(PaymentBase):
    id: int
    status: OrderStatusEnum
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
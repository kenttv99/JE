# api/schemas.py

from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from enum import Enum  # Этот импорт больше не нужен, удалите его
from pydantic import BaseModel, EmailStr, Field

from .enums import OrderStatus, OrderTypeEnum, PaymentTypeEnum, AMLStatusEnum  # Добавлен импорт Enum

class TokenData(BaseModel):
    email: Optional[str] = None

    class Config:
        from_attributes = True  # Обновлено

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

    class Config:
        from_attributes = True  # Обновлено

class UserCreate(UserBase):
    password: str

    class Config:
        from_attributes = True  # Обновлено

class UserResponse(UserBase):
    id: int
    created_at: datetime
    referral_code: Optional[str] = None
    referred_by: Optional[str] = None
    referral_link: Optional[str] = None  # Поле для реферальной ссылки

    class Config:
        from_attributes = True  # Обновлено

class ReferralData(BaseModel):
    referred_users: List[UserResponse]
    bonus_earned: Decimal

    class Config:
        from_attributes = True  # Обновлено

class ExchangeOrderBase(BaseModel):
    order_type: OrderTypeEnum
    currency: str
    amount: Decimal
    total_rub: Decimal

    class Config:
        from_attributes = True  # Обновлено

class ExchangeOrderRequest(ExchangeOrderBase):
    class Config:
        from_attributes = True  # Обновлено

class ExchangeOrderCreate(ExchangeOrderBase):
    class Config:
        from_attributes = True  # Обновлено

class ExchangeOrderResponse(ExchangeOrderBase):
    id: int
    user_id: int
    status: OrderStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Обновлено

class OrderResponse(BaseModel):
    id: int
    order_type: OrderTypeEnum
    currency: str
    amount: Decimal
    total_rub: Decimal
    status: OrderStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Обновлено

class ExchangeRateResponse(BaseModel):
    currency: str
    buy_rate: float
    sell_rate: float
    source: str
    updated_at: datetime

    class Config:
        from_attributes = True  # Обновлено

class PaymentBase(BaseModel):
    payment_method: str
    bank: str
    payment_details: str

    class Config:
        from_attributes = True  # Обновлено

class PaymentCreate(PaymentBase):
    order_id: int

    class Config:
        from_attributes = True  # Обновлено

class PaymentResponse(PaymentBase):
    id: int
    status: OrderStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Обновлено

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    class Config:
        from_attributes = True  # Обновлено

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

    class Config:
        from_attributes = True  # Обновлено

class UpdateOrderStatusRequest(BaseModel):
    status: OrderStatus

    class Config:
        from_attributes = True  # Обновлено

class UserUpdateRequest(BaseModel):
    # email: Optional[EmailStr] = None
    full_name: Optional[str] = None

    class Config:
        from_attributes = True  # Обновлено

class ReferralCodeResponse(BaseModel):
    referral_code: str
    referral_link: str

    class Config:
        from_attributes = True  # Обновлено

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True  # Обновлено

class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True  # Обновлено
        
class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=6, description="Текущий пароль")
    new_password: str = Field(..., min_length=6, description="Новый пароль")

    class Config:
        from_attributes = True  # Обновлено
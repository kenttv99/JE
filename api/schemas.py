from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum

class TokenData(BaseModel):
    """
    Схема данных токена для аутентификации.
    """
    username: Optional[str] = None

class OrderStatus(str, Enum):
    """
    Перечисление возможных статусов заказа.
    """
    pending = "pending"
    waiting_confirmation = "waiting_confirmation"
    processing = "processing"
    arbitrage = "arbitrage"
    completed = "completed"
    canceled = "canceled"

class OrderTypeEnum(str, Enum):
    """
    Перечисление типов заказа.
    """
    buy = "buy"
    sell = "sell"

class UserBase(BaseModel):
    """
    Базовая схема для пользователя.
    """
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    """
    Схема для создания нового пользователя.
    """
    password: str

class UserResponse(UserBase):
    """
    Схема ответа с информацией о пользователе.
    """
    id: int
    created_at: datetime
    referral_code: Optional[str] = None
    referred_by: Optional[str] = None
    referral_link: Optional[str] = None  # Поле для реферальной ссылки

    class Config:
        from_attributes = True

class ReferralData(BaseModel):
    """
    Схема данных для реферальной системы.
    """
    referred_users: List[UserResponse]
    bonus_earned: Decimal

class ExchangeOrderBase(BaseModel):
    """
    Базовая схема для заказа обмена валют.
    """
    order_type: OrderTypeEnum
    currency: str
    amount: Decimal
    total_rub: Decimal

class ExchangeOrderRequest(ExchangeOrderBase):
    """
    Схема запроса на создание заказа обмена валют.
    """
    pass

class ExchangeOrderCreate(ExchangeOrderBase):
    """
    Схема для создания нового заказа обмена валют.
    """
    pass

class ExchangeOrderResponse(ExchangeOrderBase):
    """
    Схема ответа с информацией о заказе обмена валют.
    """
    id: int
    user_id: int
    status: OrderStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    """
    Схема ответа с информацией о заказе.
    """
    id: int
    order_type: OrderTypeEnum
    currency: str
    amount: Decimal
    total_rub: Decimal
    status: OrderStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ExchangeRateResponse(BaseModel):
    """
    Схема ответа с информацией о курсе обмена валют.
    """
    currency: str
    rate: Decimal
    timestamp: datetime

class PaymentBase(BaseModel):
    """
    Базовая схема для платежа.
    """
    payment_method: str
    bank: str
    payment_details: str

class PaymentCreate(PaymentBase):
    """
    Схема для создания нового платежа.
    """
    order_id: int

class PaymentResponse(PaymentBase):
    """
    Схема ответа с информацией о платеже.
    """
    id: int
    status: OrderStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    """
    Схема запроса на вход.
    """
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    """
    Схема запроса на регистрацию.
    """
    email: EmailStr
    password: str
    full_name: str

class UpdateOrderStatusRequest(BaseModel):
    """
    Схема запроса на обновление статуса заказа.
    """
    status: OrderStatus

class UserUpdateRequest(BaseModel):
    """
    Схема запроса на обновление профиля пользователя.
    """
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None

class ReferralCodeResponse(BaseModel):
    """
    Схема ответа с реферальным кодом и ссылкой.
    """
    referral_code: str
    referral_link: str

class RoleCreate(BaseModel):
    """
    Схема для создания новой роли.
    """
    name: str
    description: Optional[str] = None

class RoleResponse(BaseModel):
    """
    Схема ответа с информацией о роли.
    """
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True
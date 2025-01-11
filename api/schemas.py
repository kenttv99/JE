# api/schemas.py

from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from pydantic import model_validator, Field
from api.enums import (
    OrderStatus,
    OrderTypeEnum,
    AMLStatusEnum,
    PaymentMethodEnum,
    VerificationLevelEnum
)

# -----------------------
# Схемы для PaymentMethod
# -----------------------

class PaymentMethodBase(BaseModel):
    """
    Базовая схема для методов оплаты.
    """
    payment_method: str = Field(..., example="Bank Transfer")
    bank: str = Field(..., example="Bank of Example")
    payment_details: str = Field(..., example="Account Number: 123456789")
    can_buy: bool = Field(True, description="Возможность использования для покупки")
    can_sell: bool = Field(False, description="Возможность использования для продажи")
    fee_percentage: Decimal = Field(
        Decimal('0.00'),
        description="Комиссия за транзакцию",
        example=Decimal('1.50')
    )

    class Config:
        from_attributes = True  # Позволяет работать с ORM-моделями


class PaymentMethodCreate(PaymentMethodBase):
    """
    Схема для создания нового метода оплаты.
    """
    pass  # Наследует все поля от PaymentMethodBase


class PaymentMethodResponse(PaymentMethodBase):
    """
    Схема для ответа с информацией о методе оплаты.
    """
    id: int = Field(..., example=1)

    class Config:
        from_attributes = True


class PaymentMethodSchema(BaseModel):
    id: int
    method_name: PaymentMethodEnum
    description: Optional[str] = None

    class Config:
        from_attributes = True

# -----------------------
# Схемы для ExchangeOrder
# -----------------------

class ExchangeOrderBase(BaseModel):
    """
    Базовая схема для заказа обмена.
    """
    order_type: OrderTypeEnum = Field(..., example="buy")
    currency: str = Field(..., example="BTC")
    amount: Optional[Decimal] = Field(None, example=Decimal('0.5'))
    total_rub: Optional[Decimal] = Field(None, example=Decimal('1500000'))
    crypto_address: Optional[str] = Field(None, example="1BoatSLRHtKNngkdXEeobR76b53LETtpyT")
    crypto_network: Optional[str] = Field(None, example="Bitcoin")

    class Config:
        from_attributes = True


class ExchangeOrderCreate(ExchangeOrderBase):
    """
    Схема для создания заказа обмена с указанием метода оплаты (опционально).
    """
    payment_method_id: Optional[int] = Field(
        None,
        description="ID выбранного метода оплаты",
        example=1
    )

    class Config:
        from_attributes = True


class ExchangeOrderRequest(ExchangeOrderBase):
    """
    Схема для запроса создания нового заказа обмена, наследуемая от ExchangeOrderBase.
    """
    amount: Optional[Decimal] = Field(None, example=Decimal('0.5'))
    total_rub: Optional[Decimal] = Field(None, example=Decimal('1500000'))
    payment_method: PaymentMethodEnum

    @model_validator(mode='after')
    def check_amount_or_total_rub(self):
        if (self.amount is None and self.total_rub is None):
            raise ValueError('Необходимо указать либо amount, либо total_rub.')
        if (self.amount is not None and self.total_rub is not None):
            raise ValueError('Необходимо указать либо amount, либо total_rub, но не оба одновременно.')
        return self

    class Config:
        from_attributes = True

    class Config:
        from_attributes = True


class ExchangeOrderResponse(ExchangeOrderBase):
    """
    Схема для ответа с информацией о заказе обмена.
    """
    id: int = Field(..., example=1001)
    user_id: int = Field(..., example=501)
    status: OrderStatus = Field(..., example=OrderStatus.pending)
    aml_status: AMLStatusEnum = Field(..., example=AMLStatusEnum.pending)
    created_at: datetime = Field(..., example="2025-01-09T10:47:53Z")
    updated_at: datetime = Field(..., example="2025-01-09T10:47:53Z")
    payment_method: Optional[PaymentMethodResponse] = None  # Включение информации о методе оплаты

    class Config:
        from_attributes = True

# -----------------------
# Схемы для аутентификации и пользователей
# -----------------------

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


class OrderResponse(BaseModel):
    id: int
    order_type: OrderTypeEnum
    currency: str
    amount: Decimal
    total_rub: Decimal
    median_rate: Decimal
    status: OrderStatus
    aml_status: AMLStatusEnum
    created_at: datetime
    updated_at: datetime
    payment_method: Optional[PaymentMethodSchema] = None  # Включение информации о методе оплаты

    class Config:
        from_attributes = True  # Обновлено


class ExchangeRateResponse(BaseModel):
    currency: str
    buy_rate: Decimal
    sell_rate: Decimal
    median_rate: Decimal
    source: str
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
    # payment_method: Optional[PaymentMethodEnum] = None

    class Config:
        from_attributes = True  # Обновлено


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    telegram_username: Optional[str] = None

    class Config:
        from_attributes = True


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
        
class UserDetailedResponse(BaseModel):
    """Расширенная схема ответа с информацией о пользователе"""
    id: int
    email: EmailStr
    full_name: Optional[str]
    phone_number: Optional[str] = None
    telegram_username: Optional[str] = None
    avatar_url: Optional[str] = None
    verification_level: VerificationLevelEnum
    created_at: datetime
    updated_at: datetime
    orders: List[OrderResponse] = []
    referral_code: Optional[str] = None

    class Config:
        from_attributes = True
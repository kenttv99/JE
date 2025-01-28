from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from api.enums import (
    OrderStatus,
    OrderTypeEnum,
    AMLStatusEnum,
    PaymentMethodEnum,
    VerificationLevelEnum
)

# -----------------------
# Schemas for Traders
# -----------------------

class TraderBase(BaseModel):
    email: EmailStr
    avatar_url: Optional[str] = Field(None, description="URL of trader's avatar image")
    verification_level: int = Field(0, description="Trader's verification level")
    referrer_id: Optional[int] = Field(None, description="ID of the trader who referred this trader")
    referrer_percent: Decimal = Field(
        Decimal('0.00'),
        description="Referral percentage for this trader",
        ge=Decimal('0'),
        le=Decimal('100')
    )
    pay_in: bool = Field(False, description="Whether trader can receive payments")
    pay_out: bool = Field(False, description="Whether trader can make payments")
    access: bool = Field(True, description="Whether trader has access to the system")

    class Config:
        from_attributes = True

class TraderCreate(TraderBase):
    password: str = Field(..., min_length=8, description="Trader's password")

class TraderUpdate(BaseModel):
    avatar_url: Optional[str] = None
    verification_level: Optional[int] = None
    referrer_percent: Optional[Decimal] = None
    pay_in: Optional[bool] = None
    pay_out: Optional[bool] = None
    access: Optional[bool] = None

    class Config:
        from_attributes = True

class TraderResponse(TraderBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# -----------------------
# Schemas for Merchants
# -----------------------

class MerchantBase(BaseModel):
    email: EmailStr
    avatar_url: Optional[str] = Field(None, description="URL of merchant's avatar image")
    pay_in: bool = Field(False, description="Whether merchant can receive payments")
    pay_out: bool = Field(False, description="Whether merchant can make payments")
    access: bool = Field(True, description="Whether merchant has access to the system")

    class Config:
        from_attributes = True

class MerchantCreate(MerchantBase):
    password: str = Field(..., min_length=8, description="Merchant's password")

class MerchantUpdate(BaseModel):
    avatar_url: Optional[str] = None
    pay_in: Optional[bool] = None
    pay_out: Optional[bool] = None
    access: Optional[bool] = None

    class Config:
        from_attributes = True

class MerchantResponse(MerchantBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# -----------------------
# Schemas for Admin Users
# -----------------------

class AdminUserBase(BaseModel):
    email: EmailStr
    access: bool = Field(True, description="Whether admin has access to the system")

    class Config:
        from_attributes = True

class AdminUserCreate(AdminUserBase):
    password: str = Field(..., min_length=8, description="Admin's password")

class AdminUserUpdate(BaseModel):
    access: Optional[bool] = None

    class Config:
        from_attributes = True

class AdminUserResponse(AdminUserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# -----------------------
# Schemas for Admin Traders
# -----------------------

class AdminTraderBase(BaseModel):
    email: EmailStr
    access: bool = Field(True, description="Whether admin trader has access to the system")

    class Config:
        from_attributes = True

class AdminTraderCreate(AdminTraderBase):
    password: str = Field(..., min_length=8, description="Admin trader's password")

class AdminTraderUpdate(BaseModel):
    access: Optional[bool] = None

    class Config:
        from_attributes = True

class AdminTraderResponse(AdminTraderBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# -----------------------
# Schemas for Admin Merchants
# -----------------------

class AdminMerchantBase(BaseModel):
    email: EmailStr
    access: bool = Field(True, description="Whether admin merchant has access to the system")

    class Config:
        from_attributes = True

class AdminMerchantCreate(AdminMerchantBase):
    password: str = Field(..., min_length=8, description="Admin merchant's password")

class AdminMerchantUpdate(BaseModel):
    access: Optional[bool] = None

    class Config:
        from_attributes = True

class AdminMerchantResponse(AdminMerchantBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# -----------------------
# Common Authentication Schemas
# -----------------------

class TokenData(BaseModel):
    email: Optional[str] = None

    class Config:
        from_attributes = True

class PaymentMethodSchema(BaseModel):
    id: int
    method_name: PaymentMethodEnum
    description: Optional[str] = None

    class Config:
        from_attributes = True

class ExchangeRateResponse(BaseModel):
    currency: str
    buy_rate: Decimal
    sell_rate: Decimal
    median_rate: Decimal
    source: str
    updated_at: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    class Config:
        from_attributes = True

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

    class Config:
        from_attributes = True

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    telegram_username: Optional[str] = None

    class Config:
        from_attributes = True

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
    payment_method: Optional[PaymentMethodSchema] = None

    class Config:
        from_attributes = True

class UserDetailedResponse(BaseModel):
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

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=6, description="Текущий пароль")
    new_password: str = Field(..., min_length=6, description="Новый пароль")

    class Config:
        from_attributes = True

class TwoFactorAuthRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6, description="2FA code")

    class Config:
        from_attributes = True

class TwoFactorAuthSetup(BaseModel):
    secret: str = Field(..., description="2FA secret key")
    qr_code: str = Field(..., description="QR code for 2FA setup")

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_type: str = Field(..., description="Type of user (trader/merchant/admin)")

    class Config:
        from_attributes = True

# -----------------------
# Role Schemas
# -----------------------

class RoleCreate(BaseModel):
    name: str = Field(..., description="Name of the role")
    description: Optional[str] = Field(None, description="Description of the role")

    class Config:
        from_attributes = True

class RoleResponse(BaseModel):
    id: int = Field(..., description="Unique identifier of the role")
    name: str = Field(..., description="Name of the role")
    description: Optional[str] = Field(None, description="Description of the role")

    class Config:
        from_attributes = True
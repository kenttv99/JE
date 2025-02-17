from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, model_validator
from api.enums import (
    OrderStatus,
    OrderTypeEnum,
    AMLStatusEnum,
    PaymentMethodEnum,
    TraderOrderStatus,
    TraderOrderTypeEnum,
    TraderReqStatus,
    TraderVerificationLevelEnum,
    VerificationLevelEnum,
    AddressStatusEnum,
    TraderPaymentMethodEnum,
    TraderAddressStatusEnum
)

# -----------------------
# Authentication Schemas
# -----------------------

class TokenData(BaseModel):
    email: Optional[str] = None

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

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=6, description="Текущий пароль")
    new_password: str = Field(..., min_length=6, description="Новый пароль")

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_type: str = Field(..., description="Type of user (trader/merchant/admin)")

    class Config:
        from_attributes = True

# -----------------------
# User Related Schemas
# -----------------------

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    created_at: datetime
    referral_code: Optional[str] = None
    referred_by: Optional[str] = None

    class Config:
        from_attributes = True

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    telegram_username: Optional[str] = None

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
    orders: List['TraderOrderResponse'] = []
    referral_code: Optional[str] = None

    class Config:
        from_attributes = True

# -----------------------
# Payment and Order Schemas
# -----------------------

class PaymentMethodSchema(BaseModel):
    id: int
    method_name: PaymentMethodEnum
    description: Optional[str] = None

    class Config:
        from_attributes = True

class TraderOrderResponse(BaseModel):
    id: int
    trader_id: int
    order_type: OrderTypeEnum
    currency: str
    fiat: str
    amount_currency: Decimal
    total_fiat: Decimal
    median_rate: Decimal
    status: OrderStatus
    created_at: datetime
    updated_at: datetime
    payment_method_id: int
    trader_req_id: int  # Include trader_req_id field

    class Config:
        from_attributes = True

class TraderOrderCreate(BaseModel):
    order_type: TraderOrderTypeEnum
    currency: str
    fiat: str
    amount_currency: Decimal
    total_fiat: Decimal
    payment_method_id: int
    trader_req_id: int  # Include trader_req_id field

    class Config:
        from_attributes = True

class TraderOrderUpdate(BaseModel):
    status: OrderStatus
    aml_status: Optional[AMLStatusEnum] = None

    class Config:
        from_attributes = True

class ExchangeOrderRequest(BaseModel):
    order_type: OrderTypeEnum
    currency: str = Field(..., example="BTC")
    amount: Optional[Decimal] = Field(None, example=Decimal('0.5'))
    total_rub: Optional[Decimal] = Field(None, example=Decimal('1500000'))
    crypto_address: Optional[str] = Field(None, example="1BoatSLRHtKNngkdXEeobR76b53LETtpyT")
    crypto_network: Optional[str] = Field(None, example="Bitcoin")
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

class UpdateOrderStatusRequest(BaseModel):
    status: OrderStatus

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    order_type: OrderTypeEnum
    currency: str
    amount: Decimal
    total_rub: Decimal
    status: OrderStatus
    created_at: datetime
    updated_at: datetime
    payment_method: Optional[PaymentMethodSchema] = None

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

# -----------------------
# Referral Schemas
# -----------------------

class ReferralData(BaseModel):
    referred_users: List[UserResponse]
    bonus_earned: Decimal

    class Config:
        from_attributes = True

# -----------------------
# Trader Schemas
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

class TraderUpdateRequest(BaseModel):
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
        
class TraderLoginRequest(BaseModel):
    email: EmailStr
    password: str

    class Config:
        from_attributes = True

class TraderRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

    class Config:
        from_attributes = True

class TraderDetailedResponse(BaseModel):
    id: int
    email: str
    verification_level: TraderVerificationLevelEnum
    time_zone_id: int
    time_zone_name: Optional[str]
    time_zone_offset: Optional[int]
    pay_in: bool
    pay_out: bool
    access: bool
    created_at: datetime
    updated_at: datetime
    balance: Optional[Decimal]
    fiat_currency: Optional[str]

    class Config:
        from_attributes = True
        
# -----------------------
# Trader Address Schemas
# -----------------------

class TraderAddressBase(BaseModel):
    wallet_number: str = Field(..., description="Wallet address")
    network: str = Field(..., description="Blockchain network (e.g., Bitcoin, Ethereum)")
    coin: str = Field(..., description="Cryptocurrency coin/token")

    class Config:
        from_attributes = True

class TraderAddressCreate(TraderAddressBase):
    pass  # Removing trader_id as it will be derived from the authenticated user

class TraderAddressResponse(TraderAddressBase):
    id: int
    trader_id: int
    status: TraderAddressStatusEnum  # Ensure to use TraderAddressStatusEnum here
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TraderAddressStatusUpdate(BaseModel):
    status: TraderAddressStatusEnum  # Ensure to use TraderAddressStatusEnum here

    class Config:
        from_attributes = True

# -----------------------
# Two Factor Authentication Schemas
# -----------------------

class TwoFactorAuthRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6, description="2FA code")

    class Config:
        from_attributes = True

class TwoFactorAuthSetup(BaseModel):
    secret: str = Field(..., description="2FA secret key")
    qr_code: str = Field(..., description="QR code for 2FA setup")

    class Config:
        from_attributes = True

# -----------------------
# Exchange Rate Schemas
# -----------------------

class ExchangeRateResponse(BaseModel):
    currency: str
    buy_rate: Decimal
    sell_rate: Decimal
    median_rate: Decimal
    source: str
    updated_at: datetime

    class Config:
        from_attributes = True

# -----------------------
# Trader Method Schemas
# -----------------------

class TraderMethodCreateRequest(BaseModel):
    name: str
    details: Optional[str] = None

    class Config:
        from_attributes = True

class TraderMethodResponse(BaseModel):
    id: int
    method_name: str
    details: Optional[str] = None

    class Config:
        from_attributes = True
        
# -----------------------
# ReqTrader Schemas
# -----------------------

class ReqTraderBase(BaseModel):
    payment_method: str
    bank: str
    req_number: str
    fio: str
    status: Optional[TraderReqStatus] = Field(default=TraderReqStatus.approve)
    can_buy: bool
    can_sell: bool

    class Config:
        from_attributes = True

class ReqTraderCreate(ReqTraderBase):
    pass

class ReqTraderUpdate(BaseModel):
    payment_method: str  # Make this required
    bank: str  # Make this required
    req_number: str  # Make this required
    fio: str  # Make this required
    status: Optional[TraderReqStatus] = None
    can_buy: Optional[bool] = None
    can_sell: Optional[bool] = None

    class Config:
        from_attributes = True

class ReqTraderResponse(BaseModel):
    id: int
    trader_id: int
    payment_method: str
    bank: str
    req_number: str
    fio: str
    status: TraderReqStatus
    can_buy: bool  # Add this field
    can_sell: bool # Add this field
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        
# -----------------------
# BanksTrader Schemas
# -----------------------

class BanksTraderBase(BaseModel):
    bank_name: str
    description: Optional[str] = None
    interbank: bool = False

    class Config:
        from_attributes = True

class BanksTraderCreate(BanksTraderBase):
    pass

class BanksTraderUpdate(BanksTraderBase):
    pass

class BanksTraderResponse(BanksTraderBase):
    id: int

    class Config:
        from_attributes = True
        
# -----------------------
# FiatCurrencyTrader Schemas
# -----------------------

class FiatCurrencyTraderBase(BaseModel):
    currency_name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class FiatCurrencyTraderCreate(FiatCurrencyTraderBase):
    pass

class FiatCurrencyTraderUpdate(FiatCurrencyTraderBase):
    pass

class FiatCurrencyTraderResponse(FiatCurrencyTraderBase):
    id: int

    class Config:
        from_attributes = True
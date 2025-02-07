# api/enums.py

from enum import Enum

class OrderStatus(Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    canceled = "canceled"
    arbitrage = "arbitrage"
    waiting_confirmation = "waiting_confirmation"

class AddressStatusEnum(Enum):
    approve = "approve"
    check = "check"
    delete = "delete"

class OrderTypeEnum(Enum):
    buy = "buy"
    sell = "sell"

class AMLStatusEnum(Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class PaymentMethodEnum(Enum):
    SBP = "SBP"
    BANK_TRANSFER = "SCHET"
    CARD = "CARD"
    CRYPTO = "CRYPTO"

# Добавляем новый enum для уровней верификации
class VerificationLevelEnum(Enum):
    UNVERIFIED = "Unverified"
    BASIC = "Basic Verification"
    ADVANCED = "Advanced Verification"
    
#------------------
# Traders enums
#------------------
    
class TraderPaymentMethodEnum(Enum):
    SBP = "SBP"
    BANK_TRANSFER = "SCHET"
    CARD = "CARD"
    CRYPTO = "CRYPTO"

class TraderOrderStatus(Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    canceled = "canceled"
    arbitrage = "arbitrage"
    waiting_confirmation = "waiting_confirmation"
    
class TraderVerificationLevelEnum(Enum):
    UNVERIFIED = "Unverified"
    BASIC = "Basic Verification"
    ADVANCED = "Advanced Verification"
    
class TraderAddressStatusEnum(Enum):
    approve = "approve"
    check = "check"
    delete = "delete"

class TraderOrderTypeEnum(Enum):
    buy = "buy"
    sell = "sell"
    
class TraderFiatEnum(Enum):
    RUB = "RUB"    
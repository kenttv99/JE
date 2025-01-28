# api/enums.py

from enum import Enum

class OrderStatus(Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    canceled = "canceled"
    arbitrage = "arbitrage"
    waiting_confirmation = "Waiting Confirmation"

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
    
# api/enums.py

from enum import Enum

class OrderStatus(Enum):
    pending = "Pending"
    processing = "Processing"
    completed = "Completed"
    canceled = "Canceled"
    arbitrage = "Arbitrage"
    waiting_confirmation = "Waiting Confirmation"

class OrderTypeEnum(Enum):
    buy = "buy"
    sell = "sell"

class AMLStatusEnum(Enum):
    pending = "Pending"
    approved = "Approved"
    rejected = "Rejected"

class PaymentMethodEnum(Enum):
    SBP = "SBP"
    BANK_TRANSFER = "SCHET"
    CARD = "CARD"
    CRYPTO = "CRYPTO"
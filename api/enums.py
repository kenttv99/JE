# api/enums.py

from enum import Enum

class OrderStatus(str, Enum):
    pending = "pending"
    waiting_confirmation = "waiting_confirmation"
    processing = "processing"
    arbitrage = "arbitrage"
    completed = "completed"
    canceled = "canceled"

class OrderTypeEnum(str, Enum):
    buy = "buy"
    sell = "sell"

class PaymentTypeEnum(str, Enum):
    buy = "buy"
    sell = "sell"

class AMLStatusEnum(str, Enum):
    passed = "passed"
    failed = "failed"
    pending = "pending"
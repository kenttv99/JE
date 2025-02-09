import asyncio
from typing import AsyncGenerator
from decimal import Decimal
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from constants import DATABASE_URL
from sqlalchemy.orm import (
    declarative_base,
    relationship,
    backref,
    selectinload
)
from contextlib import asynccontextmanager
from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Boolean,
    Text,
    DECIMAL,
    TIMESTAMP,
    Enum,
)
from datetime import datetime
from api.enums import (
    AddressStatusEnum,
    OrderStatus,
    OrderTypeEnum,
    AMLStatusEnum,
    PaymentMethodEnum,
    VerificationLevelEnum,
    TraderPaymentMethodEnum,
    TraderVerificationLevelEnum,
    TraderAddressStatusEnum,
    TraderOrderTypeEnum,
    TraderFiatEnum
)

# Создание асинхронного движка SQLAlchemy
engine = create_async_engine(DATABASE_URL, echo=True, future=True)

# Базовый класс для моделей
Base = declarative_base()

# Создание асинхронной фабрики сессий
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Определение моделей

class Role(Base):
    __tablename__ = 'roles'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)

    # Связь с пользователями
    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    full_name = Column(String(255), nullable=True)
    phone_number = Column(String(20), nullable=True)
    telegram_username = Column(String(100), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    two_factor_auth_token = Column(String(32), nullable=True)
    verification_level = Column(
        Enum(VerificationLevelEnum),
        default=VerificationLevelEnum.UNVERIFIED,
        nullable=False
    )
    referrer_id = Column(Integer, ForeignKey("users.id"), nullable=True, default=None)
    referral_code = Column(String(255), unique=True, nullable=True, default=None)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=False)
    is_superuser = Column(Boolean, default=False)
    
    # Существующие связи остаются без изменений
    referred_users = relationship(
        "User",
        primaryjoin="User.id==User.referrer_id",
        remote_side="User.referrer_id",
        lazy="selectin",
        viewonly=True
    )
    role = relationship("Role", back_populates="users")
    orders = relationship("ExchangeOrder", back_populates="user")


class Trader(Base):
    __tablename__ = "traders"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    avatar_url = Column(String(255), nullable=True)
    verification_level = Column(Enum(TraderVerificationLevelEnum), default=TraderVerificationLevelEnum.UNVERIFIED, nullable=False)
    referrer_id = Column(Integer, ForeignKey("traders.id"), nullable=True)
    referrer_percent = Column(DECIMAL(5, 2), default=0)
    pay_in = Column(Boolean, default=False)
    pay_out = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    access = Column(Boolean, default=True)
    two_factor_auth_token = Column(String(32), nullable=True)
    time_zone_id = Column(Integer, ForeignKey('time_zones.id'), nullable=False)
    fiat_currency_id = Column(Integer, ForeignKey('fiat_currencies_trader.id'), nullable=False, default=1)  # New field to link to fiat currency

    # Relationships
    referred_traders = relationship(
        "Trader",
        backref=backref("referrer", remote_side=[id]),
        lazy="selectin"
    )
    addresses = relationship("TraderAddress", back_populates="trader", cascade="all, delete-orphan")
    time_zone = relationship("TimeZone", backref="traders")
    orders = relationship("TraderOrder", back_populates="trader")
    req_traders = relationship("ReqTrader", back_populates="trader")
    fiat_currency = relationship("FiatCurrencyTrader", back_populates="traders")  # New relationship with FiatCurrencyTrader


class TraderAddress(Base):
    __tablename__ = "trader_addresses"
    
    id = Column(Integer, primary_key=True, index=True)
    trader_id = Column(Integer, ForeignKey("traders.id"), nullable=False)
    wallet_number = Column(String(255), nullable=False)
    network = Column(String(50), nullable=False)
    coin = Column(String(50), nullable=False)
    status = Column(Enum(TraderAddressStatusEnum), nullable=False, default=TraderAddressStatusEnum.check)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    trader = relationship("Trader", back_populates="addresses")


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    avatar_url = Column(String(255), nullable=True)
    pay_in = Column(Boolean, default=False)
    pay_out = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    access = Column(Boolean, default=True)
    two_fa_code = Column(String(32), nullable=True)


class AdminUser(Base):
    __tablename__ = "admins_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    access = Column(Boolean, default=True)
    two_fa_code = Column(String(32), nullable=True)


class AdminTrader(Base):
    __tablename__ = "admins_traders"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    access = Column(Boolean, default=True)
    two_fa_code = Column(String(32), nullable=True)


class AdminMerchant(Base):
    __tablename__ = "admins_merchants"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    access = Column(Boolean, default=True)
    two_fa_code = Column(String(32), nullable=True)


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    currency = Column(String(10), nullable=False)
    buy_rate = Column(DECIMAL(20, 8), nullable=False)
    sell_rate = Column(DECIMAL(20, 8), nullable=False)
    median_rate = Column(DECIMAL(20, 8), nullable=False)
    source = Column(String(255), nullable=False)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)


class ExchangeOrder(Base):
    __tablename__ = "exchange_orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_type = Column(Enum(OrderTypeEnum, name='ordertypeenum'), nullable=False)
    currency = Column(String(10), nullable=False)
    amount = Column(DECIMAL(20, 8), nullable=False)
    total_rub = Column(DECIMAL(20, 2), nullable=False)
    median_rate = Column(DECIMAL(20, 8), nullable=False)
    status = Column(Enum(OrderStatus, name='orderstatus'), nullable=False, default=OrderStatus.pending)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Поля для AML проверки
    crypto_address = Column(String(255), nullable=False)
    crypto_network = Column(String(100), nullable=False)
    aml_status = Column(Enum(AMLStatusEnum, name='amlstatusenum'), nullable=False, default=AMLStatusEnum.pending)
    
    # Foreign key для PaymentMethod
    payment_method_id = Column(Integer, ForeignKey("payment_methods.id"), nullable=False)

    # Связи
    user = relationship("User", back_populates="orders")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")
    payment_method = relationship("PaymentMethod", back_populates="orders")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("exchange_orders.id"), nullable=False)
    payment_method = Column(String(50), nullable=False)
    bank = Column(String(100), nullable=False)
    payment_details = Column(Text, nullable=False)
    status = Column(Enum(OrderStatus, name='paymentstatus'), default=OrderStatus.pending)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Новые поля
    can_buy = Column(Boolean, default=True, nullable=False)     # Возможность использовать для покупки
    can_sell = Column(Boolean, default=False, nullable=False)   # Возможность использовать для продажи
    fee_percentage = Column(DECIMAL(5, 2), default=Decimal('0.00'), nullable=False)  # Комиссия за транзакцию

    # Связь с заказом
    order = relationship("ExchangeOrder", back_populates="payments")


class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True, index=True)
    method_name = Column(Enum(PaymentMethodEnum), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

    # Связь с ордерами
    orders = relationship("ExchangeOrder", back_populates="payment_method")


class TraderOrder(Base):
    __tablename__ = "trader_orders"

    id = Column(Integer, primary_key=True, index=True)
    trader_id = Column(Integer, ForeignKey("traders.id"), nullable=False)
    trader_req_id = Column(Integer, ForeignKey('req_traders.id'), nullable=False)  # Link to trader's requisite
    order_type = Column(Enum(TraderOrderTypeEnum, name='traderordertypeenum'), nullable=False)
    currency = Column(String(10), nullable=False)
    fiat = Column(Enum(TraderFiatEnum, name='traderfiatenum'), nullable=False)
    amount_currency = Column(DECIMAL(20, 8), nullable=False)
    total_fiat = Column(DECIMAL(20, 2), nullable=False)
    median_rate = Column(DECIMAL(20, 8), nullable=False)
    status = Column(Enum(OrderStatus, name='orderstatus'), nullable=False, default=OrderStatus.pending)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign key для PaymentMethodTrader
    payment_method_id = Column(Integer, ForeignKey("payment_methods_trader.id"), nullable=False)

    # Связи
    trader = relationship("Trader", back_populates="orders")
    payment_method = relationship("PaymentMethodTrader", back_populates="orders")
    trader_req = relationship('ReqTrader', back_populates='orders')  # Relationship with trader's requisite


class PaymentMethodTrader(Base):
    __tablename__ = "payment_methods_trader"

    id = Column(Integer, primary_key=True, index=True)
    method_name = Column(Enum(TraderPaymentMethodEnum), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

    # Связь с ордерами
    orders = relationship("TraderOrder", back_populates="payment_method")


class ReqTrader(Base):
    __tablename__ = "req_traders"

    id = Column(Integer, primary_key=True, index=True)
    trader_id = Column(Integer, ForeignKey("traders.id"), nullable=False)
    payment_method = Column(String(50), nullable=False)
    bank = Column(String(100), ForeignKey("banks_traders.bank_name"), nullable=False)  # Link to BanksTrader
    req_number = Column(String, nullable=False)
    fio = Column(String, nullable=False)
    status = Column(Enum(OrderStatus, name='paymentstatus'), default=OrderStatus.pending)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Новые поля
    can_buy = Column(Boolean, default=True, nullable=False)     # Возможность использовать для покупки
    can_sell = Column(Boolean, default=False, nullable=False)   # Возможность использовать для продажи
    fee_percentage = Column(DECIMAL(5, 2), default=Decimal('0.00'), nullable=False)  # Комиссия за транзакцию

    # Связи
    trader = relationship("Trader", back_populates="req_traders")
    orders = relationship('TraderOrder', back_populates='trader_req')
    bank_trader = relationship("BanksTrader", back_populates="req_traders")


class BanksTrader(Base):
    __tablename__ = "banks_traders"

    id = Column(Integer, primary_key=True, index=True)
    bank_name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    interbank = Column(Boolean, default=False, nullable=False)

    # Связь с реквизитами трейдеров
    req_traders = relationship("ReqTrader", back_populates="bank_trader")


class FiatCurrencyTrader(Base):
    __tablename__ = "fiat_currencies_trader"

    id = Column(Integer, primary_key=True, index=True)
    currency_name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

    # Связь с трейдерами
    traders = relationship("Trader", back_populates="fiat_currency")


class TimeZone(Base):
    __tablename__ = "time_zones"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)  # e.g., "Europe/Moscow"
    display_name = Column(String(100), nullable=False)  # e.g., "(UTC+03:00) Moscow"
    utc_offset = Column(Integer, nullable=False)  # Offset in minutes
    is_active = Column(Boolean, default=True)
    regions = Column(String(), nullable=True)
    
    def __repr__(self):
        return f"<TimeZone(name='{self.name}', display_name='{self.display_name}')>"


async def init_db():
    """
    Инициализация базы данных.
    """
    try:
        async with engine.begin() as conn:
            # Создание всех таблиц
            await conn.run_sync(Base.metadata.create_all)
            print("Таблицы успешно созданы.")
    except Exception as e:
        print(f"Произошла ошибка при инициализации базы данных: {e}")
    finally:
        await engine.dispose()
        
@asynccontextmanager
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

# Dependency для FastAPI
async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(init_db())
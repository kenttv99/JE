# database/init_db.py

import asyncio
from typing import AsyncGenerator
from decimal import Decimal  # Импорт Decimal
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
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
    OrderStatus,
    OrderTypeEnum,
    AMLStatusEnum,
    PaymentMethodEnum,  # Импортируем PaymentMethodEnum из api.enums
)

# URL подключения к базе данных
DATABASE_URL = "postgresql+asyncpg://postgres:assasin88@localhost:5432/crypto_exchange"

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
    full_name = Column(String(255))
    referrer_id = Column(Integer, ForeignKey("users.id"), nullable=True, default=None)
    referral_code = Column(String(255), unique=True, nullable=True, default=None)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=False)
    is_superuser = Column(Boolean, default=False)
    
    # Изменяем определение связи
    referred_users = relationship(
        "User",
        primaryjoin="User.id==User.referrer_id",
        remote_side="User.referrer_id",
        lazy="selectin",
        viewonly=True  # Добавляем это свойство
    )
    role = relationship("Role", back_populates="users")
    orders = relationship("ExchangeOrder", back_populates="user")


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    currency = Column(String(10), nullable=False)
    buy_rate = Column(DECIMAL(20, 8), nullable=False)
    sell_rate = Column(DECIMAL(20, 8), nullable=False)
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


async def init_db():
    """Инициализация базы данных."""
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
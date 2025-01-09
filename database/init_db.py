# database/init_db.py

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Text, DECIMAL, TIMESTAMP, Enum
from datetime import datetime
from api.enums import OrderStatus  # Убедитесь, что OrderStatus импортирован

# URL подключения к базе данных
DATABASE_URL = "postgresql+asyncpg://postgres:assasin88@localhost:5432/crypto_exchange"

# Создание асинхронного движка SQLAlchemy
engine = create_async_engine(DATABASE_URL, echo=True, future=True)

# Базовый класс для моделей
Base = declarative_base()

# Создание фабрики сессий
AsyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession
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
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=False)
    is_superuser = Column(Boolean, default=False)
    
    # Связи
    referred_users = relationship("User", backref="referrer", remote_side=[id])
    role = relationship("Role", back_populates="users")
    orders = relationship("ExchangeOrder", back_populates="user")

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    currency = Column(String(10), nullable=False)
    buy_rate = Column(DECIMAL(20, 8), nullable=False)
    sell_rate = Column(DECIMAL(20, 8), nullable=False)
    source = Column(String(255), nullable=False)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)

class ExchangeOrder(Base):
    __tablename__ = "exchange_orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_type = Column(Enum('buy', 'sell', name='ordertypeenum'), nullable=False)
    currency = Column(String(10), nullable=False)
    amount = Column(DECIMAL(20, 8), nullable=False)
    total_rub = Column(DECIMAL(20, 2), nullable=False)
    status = Column(Enum('pending', 'waiting_confirmation', 'processing', 'arbitrage', 'completed', 'canceled', name='orderstatus'), nullable=False, default='pending')
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Поля для AML проверки
    crypto_address = Column(String(255), nullable=False)
    crypto_network = Column(String(100), nullable=False)
    aml_status = Column(Enum('passed', 'failed', 'pending', name='amlstatusenum'), nullable=False, default='pending')

    # Связи
    user = relationship("User", back_populates="orders")
    payments = relationship("Payment", back_populates="order")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("exchange_orders.id"), nullable=False)
    payment_method = Column(String(50), nullable=False)
    bank = Column(String(100), nullable=False)
    payment_details = Column(Text, nullable=False)
    status = Column(Enum(OrderStatus), default='pending')
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Новые поля
    can_buy = Column(Boolean, default=True, nullable=False)     # Возможность использовать для покупки
    can_sell = Column(Boolean, default=False, nullable=False)   # Возможность использовать для продажи
    fee_percentage = Column(DECIMAL(5, 2), default=0.0, nullable=False)  # Комиссия за транзакцию

    # Связь с заказом
    order = relationship("ExchangeOrder", back_populates="payments")

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

async def get_async_db():
    """Создание асинхронной сессии базы данных."""
    async with AsyncSessionLocal() as session:
        yield session

if __name__ == "__main__":
    asyncio.run(init_db())
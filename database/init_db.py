from sqlalchemy import create_engine, Column, Integer, String, DECIMAL, ForeignKey, TIMESTAMP, Text, Enum, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Абсолютный импорт
from api.schemas import OrderStatus

# Базовые настройки SQLAlchemy
DATABASE_URL = "postgresql://postgres:assasin88@localhost:5432/crypto_exchange"
engine = create_engine(DATABASE_URL)
Base = declarative_base()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Определение модели Role
class Role(Base):
    __tablename__ = 'roles'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)

# Обновление модели User для поддержки ролей
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
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=False)  # Добавляем связь с Role
    
    # Связь с приглашёнными пользователями
    referred_users = relationship("User", backref="referrer", remote_side=[id])
    role = relationship("Role", back_populates="users")
    orders = relationship("ExchangeOrder", back_populates="user")  # Добавляем связь с заказами

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
    order_type = Column(Enum("buy", "sell", name="order_type"), nullable=False)
    currency = Column(String(10), nullable=False)
    amount = Column(DECIMAL(20, 8), nullable=False)
    total_rub = Column(DECIMAL(20, 2), nullable=False)
    status = Column(String, nullable=False, default=OrderStatus.pending.value)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    payments = relationship("Payment", back_populates="order")  # Добавляем связь с платежами

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("exchange_orders.id"), nullable=False)
    payment_method = Column(String(50), nullable=False)
    bank = Column(String(100), nullable=False)
    payment_details = Column(Text, nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.pending)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)

    order = relationship("ExchangeOrder", back_populates="payments")

# Обратная связь для Role
Role.users = relationship("User", back_populates="role")

# Создание таблиц
def init_db():
    Base.metadata.create_all(bind=engine)
    logging.info("Все таблицы успешно созданы или уже существуют.")
    
    # Инициализация ролей и пользователей
    db = SessionLocal()
    try:
        if db.query(Role).count() == 0:
            roles = [
                Role(name="admin", description="Administrator role"),
                Role(name="trader", description="Trader role"),
                Role(name="user", description="Regular user role"),
            ]
            db.add_all(roles)
            db.commit()

        if db.query(User).count() == 0:
            admin_role = db.query(Role).filter(Role.name == "admin").first()
            example_user = User(
                email="admin@example.com",
                password_hash="hashed_password_placeholder",
                role_id=admin_role.id,
                is_superuser=True
            )
            db.add(example_user)
            db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
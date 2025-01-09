# init_data.py

import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy import select, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import hash_password
from database.init_db import AsyncSessionLocal, init_db
from database.init_db import Role, User, PaymentMethod, PaymentMethodEnum  # Добавляем PaymentMethod и PaymentMethodEnum

# Настройка логирования
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

async def init_roles(db: AsyncSession):
    """
    Асинхронная инициализация ролей.
    """
    try:
        # Построение запроса для подсчёта количества ролей
        stmt = select(func.count()).select_from(Role)
        count = await db.scalar(stmt)
        
        if count == 0:
            # Если ролей нет, добавляем стандартные роли
            roles = [
                Role(name="admin", description="Administrator role"),
                Role(name="trader", description="Trader role"),
                Role(name="user", description="Regular user role"),
            ]
            db.add_all(roles)
            await db.commit()
            logger.info("Роли успешно инициализированы")
        else:
            logger.info("Роли уже существуют в базе данных")
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Произошла ошибка при инициализации ролей: {e}")

async def init_payment_methods(db: AsyncSession):
    """
    Асинхронная инициализация методов оплаты.
    """
    try:
        # Построение запроса для подсчёта количества методов оплаты
        stmt = select(func.count()).select_from(PaymentMethod)
        count = await db.scalar(stmt)
        
        if count == 0:
            # Если методов оплаты нет, добавляем стандартные методы
            payment_methods = [
                PaymentMethod(method_name=PaymentMethodEnum.CREDIT_CARD, description="Оплата кредитной картой"),
                PaymentMethod(method_name=PaymentMethodEnum.BANK_TRANSFER, description="Банковский перевод"),
                PaymentMethod(method_name=PaymentMethodEnum.PAYPAL, description="Оплата через PayPal"),
                PaymentMethod(method_name=PaymentMethodEnum.CRYPTO, description="Оплата криптовалютой"),
            ]
            db.add_all(payment_methods)
            await db.commit()
            logger.info("Методы оплаты успешно инициализированы")
        else:
            logger.info("Методы оплаты уже существуют в базе данных")
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Произошла ошибка при инициализации методов оплаты: {e}")

async def init_users(db: AsyncSession):
    """
    Асинхронная инициализация пользователей.
    """
    try:
        # Построение запроса для подсчёта количества пользователей
        stmt = select(func.count()).select_from(User)
        count = await db.scalar(stmt)
        
        if count == 0:
            # Получение роли администратора
            stmt_role = select(Role).where(Role.name == "admin")
            result = await db.execute(stmt_role)
            admin_role = result.scalar_one_or_none()
            
            if admin_role:
                # Создание примера администратора
                example_user = User(
                    email="admin@example.com",
                    password_hash=hash_password("admin_password"),  # Используем функцию хэширования пароля
                    full_name="Admin User",
                    role_id=admin_role.id,
                    is_superuser=True,
                    created_at=datetime.now(timezone.utc).replace(tzinfo=None),  # Удаляем информацию о временной зоне
                    updated_at=datetime.now(timezone.utc).replace(tzinfo=None)   # Удаляем информацию о временной зоне
                )
                db.add(example_user)
                await db.commit()
                logger.info("Администратор успешно инициализирован")
            else:
                logger.error("Роль администратора не существует")
        else:
            logger.info("Пользователи уже существуют в базе данных")
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Произошла ошибка при инициализации пользователей: {e}")

async def init_data(db: AsyncSession):
    """
    Общая асинхронная инициализация данных.
    """
    await init_roles(db)
    await init_payment_methods(db)  # Добавляем инициализацию методов оплаты
    await init_users(db)

async def main():
    """
    Основная асинхронная функция для запуска инициализации данных.
    """
    # Инициализируем базу данных и создаём сессию
    await init_db()
    async with AsyncSessionLocal() as session:
        await init_data(session)

if __name__ == "__main__":
    asyncio.run(main())
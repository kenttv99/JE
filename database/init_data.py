# init_data.py

import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy import select, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import hash_password
from database.init_db import (
    AsyncSessionLocal, TimeZone, init_db, Role, User,
    PaymentMethod, PaymentMethodEnum, FiatCurrencyTrader,
    PaymentMethodTrader, TraderPaymentMethodEnum
)

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
                PaymentMethod(method_name=PaymentMethodEnum.SBP, description="SBP"),
                PaymentMethod(method_name=PaymentMethodEnum.BANK_TRANSFER, description="BANK_TRANSFER"),
                PaymentMethod(method_name=PaymentMethodEnum.CARD, description="CARD"),
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

async def init_trader_payment_methods(db: AsyncSession):
    """
    Асинхронная инициализация методов оплаты для трейдеров.
    """
    try:
        # Построение запроса для подсчёта количества методов оплаты трейдеров
        stmt = select(func.count()).select_from(PaymentMethodTrader)
        count = await db.scalar(stmt)
        
        if count == 0:
            # Если методов оплаты нет, добавляем стандартные методы для трейдеров
            trader_payment_methods = [
                PaymentMethodTrader(
                    method_name=TraderPaymentMethodEnum.SBP,
                    description="Система быстрых платежей (СБП)"
                ),
                PaymentMethodTrader(
                    method_name=TraderPaymentMethodEnum.BANK_TRANSFER,
                    description="Банковский счёт"
                ),
                PaymentMethodTrader(
                    method_name=TraderPaymentMethodEnum.CARD,
                    description="Банковская карта"
                ),
                PaymentMethodTrader(
                    method_name=TraderPaymentMethodEnum.CRYPTO,
                    description="Криптовалюта"
                )
            ]
            db.add_all(trader_payment_methods)
            await db.commit()
            logger.info("Методы оплаты для трейдеров успешно инициализированы")
        else:
            logger.info("Методы оплаты для трейдеров уже существуют в базе данных")
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Произошла ошибка при инициализации методов оплаты для трейдеров: {e}")

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
                    password_hash=hash_password("admin_password"),
                    full_name="Admin User",
                    role_id=admin_role.id,
                    is_superuser=True,
                    created_at=datetime.now(timezone.utc).replace(tzinfo=None),
                    updated_at=datetime.now(timezone.utc).replace(tzinfo=None)
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

async def init_time_zones(db: AsyncSession) -> None:
    """
    Initialize time zones table with Russian time zones only.
    Includes detailed region information for each time zone.
    """
    try:
        # Check if time zones already exist
        result = await db.execute(select(func.count()).select_from(TimeZone))
        count = result.scalar()
        
        if count > 0:
            logger.info("Time zones already initialized")
            return

        # List of Russian time zones with their regions
        russian_time_zones = [
            {
                "name": "Europe/Kaliningrad",
                "display_name": "(UTC+02:00) Калининградская область",
                "utc_offset": 120,
                "regions": "Калининградская область"
            },
            {
                "name": "Europe/Moscow",
                "display_name": "(UTC+03:00) Москва и центральная Россия",
                "utc_offset": 180,
                "regions": "Москва, Санкт-Петербург, Севастополь, Республика Адыгея, Республика Крым, "
                          "Белгородская область, Брянская область, Владимирская область, Волгоградская область, "
                          "Вологодская область, Воронежская область, Ивановская область, Калужская область, "
                          "Костромская область, Курская область, Липецкая область, Московская область, "
                          "Нижегородская область, Орловская область, Пензенская область, Ростовская область, "
                          "Рязанская область, Саратовская область, Смоленская область, Тамбовская область, "
                          "Тверская область, Тульская область, Ярославская область"
            },
            # ... (оставшиеся часовые пояса остаются без изменений)
        ]

        time_zone_objects = [
            TimeZone(
                name=tz["name"],
                display_name=tz["display_name"],
                utc_offset=tz["utc_offset"],
                regions=tz["regions"],
                is_active=True
            )
            for tz in russian_time_zones
        ]

        db.add_all(time_zone_objects)
        await db.commit()
        logger.info(f"Successfully initialized {len(russian_time_zones)} Russian time zones with regions")
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Error initializing Russian time zones: {str(e)}")
        raise

async def init_fiat_currencies(db: AsyncSession):
    """
    Асинхронная инициализация валют для трейдеров.
    """
    try:
        # Построение запроса для подсчёта количества валют
        stmt = select(func.count()).select_from(FiatCurrencyTrader)
        count = await db.scalar(stmt)
        
        if count == 0:
            # Если валют нет, добавляем стандартные валюты
            fiat_currencies = [
                FiatCurrencyTrader(currency_name="RUB", description="Russian Ruble"),
                FiatCurrencyTrader(currency_name="KZT", description="Kazakhstani Tenge"),
                FiatCurrencyTrader(currency_name="UZS", description="Uzbekistani Som"),
            ]
            db.add_all(fiat_currencies)
            await db.commit()
            logger.info("Валюты трейдеров успешно инициализированы")
        else:
            logger.info("Валюты трейдеров уже существуют в базе данных")
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Произошла ошибка при инициализации валют трейдеров: {e}")

async def init_data(db: AsyncSession):
    """
    Общая асинхронная инициализация данных.
    """
    await init_roles(db)
    await init_payment_methods(db)
    await init_trader_payment_methods(db)  # Добавлен вызов инициализации методов оплаты трейдеров
    await init_users(db)
    await init_time_zones(db)
    await init_fiat_currencies(db)

async def main():
    """
    Основная асинхронная функция для запуска инициализации данных.
    """
    await init_db()
    async with AsyncSessionLocal() as session:
        await init_data(session)

if __name__ == "__main__":
    asyncio.run(main())
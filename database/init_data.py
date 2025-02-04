# init_data.py

import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy import select, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import hash_password
from database.init_db import AsyncSessionLocal, TimeZone, init_db
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
            {
                "name": "Europe/Samara",
                "display_name": "(UTC+04:00) Самара и Удмуртия",
                "utc_offset": 240,
                "regions": "Самарская область, Удмуртская Республика, Ульяновская область, "
                          "Республика Татарстан, Астраханская область"
            },
            {
                "name": "Asia/Yekaterinburg",
                "display_name": "(UTC+05:00) Екатеринбург и Урал",
                "utc_offset": 300,
                "regions": "Свердловская область, Челябинская область, Курганская область, "
                          "Тюменская область, Ханты-Мансийский АО, Ямало-Ненецкий АО, "
                          "Республика Башкортостан, Оренбургская область, Пермский край"
            },
            {
                "name": "Asia/Omsk",
                "display_name": "(UTC+06:00) Омск и Западная Сибирь",
                "utc_offset": 360,
                "regions": "Омская область, Новосибирская область, Томская область, "
                          "Алтайский край, Республика Алтай, Кемеровская область"
            },
            {
                "name": "Asia/Krasnoyarsk",
                "display_name": "(UTC+07:00) Красноярск и Центральная Сибирь",
                "utc_offset": 420,
                "regions": "Красноярский край, Республика Хакасия, Республика Тыва, "
                          "Кемеровская область - Кузбасс"
            },
            {
                "name": "Asia/Irkutsk",
                "display_name": "(UTC+08:00) Иркутск и Прибайкалье",
                "utc_offset": 480,
                "regions": "Иркутская область, Республика Бурятия"
            },
            {
                "name": "Asia/Yakutsk",
                "display_name": "(UTC+09:00) Якутск и Восточная Сибирь",
                "utc_offset": 540,
                "regions": "Республика Саха (Якутия) - центральные и южные районы, "
                          "Забайкальский край, Амурская область"
            },
            {
                "name": "Asia/Vladivostok",
                "display_name": "(UTC+10:00) Владивосток и Дальний Восток",
                "utc_offset": 600,
                "regions": "Приморский край, Хабаровский край, Еврейская автономная область, "
                          "Республика Саха (Якутия) - восточные районы"
            },
            {
                "name": "Asia/Magadan",
                "display_name": "(UTC+11:00) Магадан и Сахалин",
                "utc_offset": 660,
                "regions": "Магаданская область, Сахалинская область, "
                          "Республика Саха (Якутия) - северо-восточные районы"
            },
            {
                "name": "Asia/Kamchatka",
                "display_name": "(UTC+12:00) Камчатка и Чукотка",
                "utc_offset": 720,
                "regions": "Камчатский край, Чукотский автономный округ"
            }
        ]

        # Create TimeZone objects with all fields including regions
        current_time = datetime.utcnow()
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

        # Add all time zones to the database
        db.add_all(time_zone_objects)
        await db.commit()

        logger.info(f"Successfully initialized {len(russian_time_zones)} Russian time zones with regions")
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Error initializing Russian time zones: {str(e)}")
        raise

async def init_data(db: AsyncSession):
    """
    Общая асинхронная инициализация данных.
    """
    await init_roles(db)
    await init_payment_methods(db)  # Добавляем инициализацию методов оплаты
    await init_users(db)
    await init_time_zones(db)

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
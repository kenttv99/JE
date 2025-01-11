# api/endpoints/auth_routers.py

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import timedelta, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select  # Добавляем импорт select
from sqlalchemy.orm import selectinload
from typing import Optional, List

from api.auth import (
    create_access_token,
    verify_password,
    hash_password,
    get_current_user
)
from database.init_db import User, Role, ExchangeOrder, get_async_db
from api.schemas import (
    LoginRequest,
    RegisterRequest,
    UserUpdateRequest,
    ChangePasswordRequest,  # Импортируем новую модель
    UserDetailedResponse,   # Добавляем новую схему
    OrderResponse          # Добавляем схему для ответа с заказами
)
from api.utils.user_utils import get_current_user_info
from api.enums import OrderStatus, VerificationLevelEnum

# Настройка логирования
from config.logging_config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register")
async def register_user(request: RegisterRequest, db: AsyncSession = Depends(get_async_db)):
    """Регистрация нового пользователя."""
    logger.info("Регистрация пользователя с email: %s", request.email)
    
    # Проверка, существует ли уже пользователь с таким email
    result = await db.execute(select(User).filter(User.email == request.email))
    existing_user = result.scalars().first()
    if existing_user:
        logger.warning("Регистрация не удалась: email %s уже зарегистрирован", request.email)
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

    # Хеширование пароля
    hashed_password = hash_password(request.password)
    
    # Получение роли по умолчанию (например, 'user')
    result = await db.execute(select(Role).filter(Role.name == 'user'))
    default_role = result.scalars().first()
    if not default_role:
        logger.error("Роль по умолчанию 'user' не найдена в базе данных.")
        raise HTTPException(status_code=500, detail="Роль по умолчанию не найдена. Свяжитесь с администратором.")

    # Создание нового пользователя с указанием role_id
    new_user = User(
        email=request.email,
        password_hash=hashed_password,
        full_name=request.full_name,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        role_id=default_role.id  # Устанавливаем role_id
    )
    db.add(new_user)
    
    # Используем транзакционный контекст для коммита
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error("Ошибка при регистрации пользователя %s: %s", request.email, e)
        raise HTTPException(status_code=500, detail="Ошибка регистрации пользователя")

    await db.refresh(new_user)
    logger.info("Пользователь %s успешно зарегистрирован", request.email)
    return {"message": "Пользователь успешно зарегистрирован"}


@router.post("/login")
async def login_user(request: LoginRequest, db: AsyncSession = Depends(get_async_db)):
    """Авторизация пользователя."""
    logger.info("Попытка входа пользователя с email: %s", request.email)
    
    # Получение пользователя по email из базы данных
    result = await db.execute(select(User).filter(User.email == request.email))
    user = result.scalars().first()
    
    if not user:
        logger.warning("Неудачная попытка входа: пользователь с email %s не найден", request.email)
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    
    # Проверка пароля
    if not verify_password(request.password, user.password_hash):
        logger.warning("Неудачная попытка входа: неверный пароль для %s", request.email)
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    # Создание токена доступа
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    
    logger.info("Пользователь %s успешно вошёл в систему", request.email)
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserDetailedResponse)
async def get_me(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
    start_date: Optional[datetime] = Query(None, description="Фильтр заказов: начальная дата"),
    end_date: Optional[datetime] = Query(None, description="Фильтр заказов: конечная дата"),
    status: Optional[OrderStatus] = Query(None, description="Фильтр заказов: статус")
):
    """
    Получение детальной информации о текущем пользователе, включая историю заказов с фильтрацией.
    """
    try:
        # Получаем информацию о пользователе с предзагрузкой заказов
        stmt = (
            select(User)
            .options(selectinload(User.orders))
            .filter(User.id == current_user.id)
        )
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")

        # Формируем запрос для получения отфильтрованных заказов с загрузкой payment_method
        orders_query = (
            select(ExchangeOrder)
            .options(selectinload(ExchangeOrder.payment_method))  # Добавляем загрузку payment_method
            .filter(ExchangeOrder.user_id == user.id)
        )

        # Применяем фильтры
        if start_date:
            orders_query = orders_query.filter(ExchangeOrder.created_at >= start_date)
        if end_date:
            orders_query = orders_query.filter(ExchangeOrder.created_at <= end_date)
        if status:
            orders_query = orders_query.filter(ExchangeOrder.status == status)

        # Получаем отфильтрованные заказы
        orders_result = await db.execute(orders_query)
        filtered_orders = orders_result.unique().scalars().all()  # Добавляем unique() для избежания дубликатов

        # Формируем ответ
        return UserDetailedResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone_number=user.phone_number,
            telegram_username=user.telegram_username,
            avatar_url=user.avatar_url,
            verification_level=user.verification_level if user.verification_level else VerificationLevelEnum.UNVERIFIED,
            created_at=user.created_at,
            updated_at=user.updated_at,
            orders=filtered_orders,
            referral_code=user.referral_code
        )

    except HTTPException as http_exc:
        logger.error(f"HTTP ошибка при получении информации о пользователе: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"Неожиданная ошибка при получении информации о пользователе: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Внутренняя ошибка сервера при получении информации о пользователе"
        )
    finally:
        await db.rollback()  # Добавляем rollback в finally для очистки сессии

@router.put("/update_profile")
async def update_profile(
    user_update: UserUpdateRequest, 
    db: AsyncSession = Depends(get_async_db), 
    current_user: User = Depends(get_current_user)
):
    """Обновление профиля текущего пользователя."""
    user_email = current_user.email  # Сохраняем email заранее для логирования
    logger.debug("Начало обновления профиля пользователя: %s", user_email)
    try:
        # Предварительно загружаем все необходимые атрибуты пользователя
        user = await get_current_user_info(db, current_user)
        if not user:
            logger.warning("Пользователь не найден: %s", user_email)
            raise HTTPException(status_code=404, detail="Пользователь не найден")

        # Обновляем только поле full_name, поле email не обновляется
        user.full_name = user_update.full_name or user.full_name
        user.updated_at = datetime.utcnow()
        
        # Коммит изменений в базу данных внутри транзакционного контекста
        try:
            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.error("Ошибка при коммите изменений профиля пользователя %s: %s", user_email, e)
            raise HTTPException(status_code=500, detail="Ошибка обновления профиля")

        logger.info("Профиль пользователя %s успешно обновлен", user_email)
        return {"message": "Профиль успешно обновлен"}

    except HTTPException as http_exc:
        # Пробрасываем уже обработанные HTTP-исключения
        raise http_exc
    except Exception as e:
        # Обработка общих исключений без дополнительных асинхронных вызовов
        logger.error("Неизвестная ошибка при обновлении профиля пользователя %s: %s", user_email, e)
        raise HTTPException(status_code=500, detail="Ошибка обновления профиля")


@router.put("/change_password")
async def change_password(
    request: ChangePasswordRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Изменение пароля текущего пользователя."""
    user_email = current_user.email  # Сохраняем email пользователя заранее
    logger.info("Пользователь %s пытается изменить пароль", user_email)

    try:
        # Верификация текущего пароля
        if not verify_password(request.current_password, current_user.password_hash):
            logger.warning(
                "Неудачная попытка изменения пароля пользователем %s: неверный текущий пароль",
                user_email
            )
            raise HTTPException(status_code=401, detail="Неверный текущий пароль")

        # Хеширование нового пароля
        hashed_new_password = hash_password(request.new_password)

        # Обновление пароля и времени обновления
        current_user.password_hash = hashed_new_password
        current_user.updated_at = datetime.utcnow()

        # Коммит изменений в базу данных внутри транзакционного контекста
        try:
            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.error("Ошибка при коммите изменения пароля пользователя %s: %s", user_email, e)
            raise HTTPException(status_code=500, detail="Ошибка изменения пароля")

        logger.info("Пользователь %s успешно изменил пароль", user_email)
        return {"message": "Пароль успешно изменен"}
    
    except HTTPException as http_exc:
        # Уже обработанные HTTP исключения
        raise http_exc
    except Exception as e:
        # Обработка неожиданных исключений без дополнительных асинхронных вызовов
        logger.error("Неизвестная ошибка при изменении пароля пользователя %s: %s", user_email, e)
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")
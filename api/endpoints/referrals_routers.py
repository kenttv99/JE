from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from datetime import datetime
from api.auth import get_current_user
from database.init_db import User, get_async_db
from api.schemas import ReferralData, UserResponse
import logging

from config.logging_config import setup_logging
setup_logging()
logger = logging.getLogger("referrals")

router = APIRouter()

# Получение данных реферальной системы
@router.get("/referrals", response_model=ReferralData)
async def get_referrals(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_async_db)
):
    try:
        # Используем только прямой запрос, так как он более надежный
        stmt = select(User).where(User.referrer_id == current_user.id)
        result = await db.execute(stmt)
        referrals = result.scalars().all()

        logger.info(f"Найдено рефералов: {len(referrals)}")
        
        response_data = ReferralData(
            referred_users=[
                UserResponse(
                    id=ref.id,
                    email=ref.email,
                    full_name=ref.full_name,
                    created_at=ref.created_at,
                    referral_code=ref.referral_code,
                    referred_by=current_user.referral_code,
                )
                for ref in referrals
            ],
            bonus_earned=0  # Или ваша логика подсчета бонусов
        )

        logger.info(f"Отправляем данные о {len(response_data.referred_users)} рефералах")
        return response_data

    except Exception as e:
        logger.error(f"Ошибка при получении данных рефералов: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Ошибка при получении данных рефералов: {str(e)}"
        )


# Генерация реферального кода
@router.post("/referrals/generate", response_model=str)
async def generate_referral_code(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_async_db)
):
    """
    Генерация реферального кода для текущего пользователя (асинхронная версия).
    """
    # Получаем пользователя с помощью select() и await db.execute(...)
    stmt = select(User).where(User.id == current_user.id)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        logger.error("Пользователь с id %s не найден", current_user.id)
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Если у пользователя ещё нет кода, генерируем новый
    if not user.referral_code:
        user.referral_code = f"REF-{user.id}-{int(datetime.utcnow().timestamp())}"
        # commit и refresh также вызываем асинхронно
        await db.commit()
        await db.refresh(user)
        logger.info("Реферальный код сгенерирован: %s", user.referral_code)

    return user.referral_code


# Получение уже созданного промокода и реферальной ссылки
@router.get("/referrals/code", response_model=dict)
async def get_referral_code(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_async_db)
):
    """
    Получение уже созданного промокода и реферальной ссылки для текущего пользователя (асинхронная версия).
    """
    # Получаем пользователя через select() и await db.execute(...)
    stmt = select(User).where(User.id == current_user.id)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        logger.error("Пользователь с id %s не найден", current_user.id)
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Проверяем, что у пользователя уже есть реферальный код
    if not user.referral_code:
        raise HTTPException(status_code=404, detail="Реферальный код не найден")

    # Формируем реферальную ссылку
    referral_link = f"https://example.com/referral/{user.referral_code}"  # Шаблонная ссылка

    return {"referral_code": user.referral_code, "referral_link": referral_link}
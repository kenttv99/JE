from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from api.auth import get_current_user
from database.init_db import User
from api.schemas import ReferralData, UserResponse
import logging

from config.logging_config import setup_logging
setup_logging()
logger = logging.getLogger("referrals")
from api.utils.user_utils import get_db  # Исправленный импорт

# Создаем роутер
router = APIRouter()

# Получение данных реферальной системы
@router.get("/referrals", response_model=ReferralData)
def get_referrals(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Получение данных реферальной системы для текущего пользователя.
    """
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        logger.error("Пользователь с id %s не найден", current_user.id)
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    referred_users = user.referred_users
    if referred_users is None:
        referred_users = []

    bonus_earned = sum(getattr(ref_user, "referral_bonus", 0) for ref_user in referred_users)

    response_data = ReferralData(
        referred_users=[
            UserResponse(
                id=ref_user.id,
                email=ref_user.email,
                full_name=ref_user.full_name,
                created_at=ref_user.created_at,
                referral_code=ref_user.referral_code,
                referred_by=user.referral_code,
            )
            for ref_user in referred_users
        ],
        bonus_earned=bonus_earned,
    )

    return response_data

# Генерация реферального кода
@router.post("/referrals/generate", response_model=str)
def generate_referral_code(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Генерация реферального кода для текущего пользователя.
    """
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        logger.error("Пользователь с id %s не найден", current_user.id)
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if not user.referral_code:
        user.referral_code = f"REF-{user.id}-{int(datetime.utcnow().timestamp())}"
        db.commit()
        db.refresh(user)
        logger.info("Реферальный код сгенерирован: %s", user.referral_code)

    return user.referral_code

# Получение уже созданного промокода и реферальной ссылки
@router.get("/referrals/code", response_model=dict)
def get_referral_code(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Получение уже созданного промокода и реферальной ссылки для текущего пользователя.
    """
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        logger.error("Пользователь с id %s не найден", current_user.id)
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if not user.referral_code:
        raise HTTPException(status_code=404, detail="Реферальный код не найден")

    referral_link = f"https://example.com/referral/{user.referral_code}"  # Шаблонная ссылка

    return {"referral_code": user.referral_code, "referral_link": referral_link}
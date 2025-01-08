import logging
from fastapi import APIRouter, Depends, HTTPException
from datetime import timedelta, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select  # Добавляем импорт select

from api.auth import create_access_token, verify_password, hash_password, get_current_user
from database.init_db import User, get_async_db
from api.schemas import LoginRequest, RegisterRequest, UserUpdateRequest
from api.utils.user_utils import get_current_user_info

# Настройка логирования
from config.logging_config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/register")
async def register_user(request: RegisterRequest, db: AsyncSession = Depends(get_async_db)):
    """Регистрация нового пользователя."""
    logger.info("Регистрация пользователя с email: %s", request.email)
    result = await db.execute(select(User).filter(User.email == request.email))
    existing_user = result.scalars().first()
    if existing_user:
        logger.warning("Регистрация не удалась: email %s уже зарегистрирован", request.email)
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

    hashed_password = hash_password(request.password)
    new_user = User(email=request.email, password_hash=hashed_password, full_name=request.full_name)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    logger.info("Пользователь %s успешно зарегистрирован", request.email)
    return {"message": "Пользователь успешно зарегистрирован"}

@router.post("/login")
async def login_user(request: LoginRequest, db: AsyncSession = Depends(get_async_db)):
    """Авторизация пользователя."""
    logger.info("Попытка входа пользователя с email: %s", request.email)
    user = await get_current_user_info(db, request)
    if not verify_password(request.password, user.password_hash):
        logger.warning("Неудачная попытка входа: неверный email или пароль для %s", request.email)
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    logger.info("Пользователь %s успешно вошел в систему", request.email)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Получение информации о текущем пользователе."""
    logger.info("Запрос информации о текущем пользователе: %s", current_user.email)
    return {"email": current_user.email}

@router.get("/protected-route")
async def protected_route(current_user: User = Depends(get_current_user)):
    """Пример защищенного маршрута."""
    logger.info("Доступ к защищенному маршруту предоставлен пользователю: %s", current_user.email)
    return {"message": "Вы авторизованы!", "email": current_user.email}

@router.put("/update_profile")
async def update_profile(user_update: UserUpdateRequest, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    """Обновление профиля текущего пользователя."""
    user = await get_current_user_info(db, current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    user.email = user_update.email or user.email
    user.full_name = user_update.full_name or user.full_name
    user.updated_at = datetime.utcnow()
    await db.commit()
    return {"message": "Профиль успешно обновлен"}
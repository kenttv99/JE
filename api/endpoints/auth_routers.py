import logging
from fastapi import APIRouter, Depends, HTTPException
from datetime import timedelta, datetime
from sqlalchemy.orm import Session

from api.auth import create_access_token, verify_password, hash_password, get_current_user
from database.init_db import User
from api.schemas import LoginRequest, RegisterRequest, UserUpdateRequest
from api.utils.user_utils import get_current_user_info, get_db

# Настройка логирования
from config.logging_config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

# Создаем роутер
router = APIRouter()

# Обработчик регистрации
@router.post("/register")
def register_user(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Регистрация нового пользователя.
    """
    logger.info("Регистрация пользователя с email: %s", request.email)
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        logger.warning("Регистрация не удалась: email %s уже зарегистрирован", request.email)
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

    hashed_password = hash_password(request.password)
    new_user = User(email=request.email, password_hash=hashed_password, full_name=request.full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    logger.info("Пользователь %s успешно зарегистрирован", request.email)
    return {"message": "Пользователь успешно зарегистрирован"}

# Обработчик входа
@router.post("/login")
def login_user(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Вход пользователя.
    """
    logger.info("Попытка входа пользователя с email: %s", request.email)
    user = get_current_user_info(db, request)
    if not verify_password(request.password, user.password_hash):
        logger.warning("Неудачная попытка входа: неверный email или пароль для %s", request.email)
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    logger.info("Пользователь %s успешно вошел в систему", request.email)
    return {"access_token": access_token, "token_type": "bearer"}

# Получение информации о текущем пользователе
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """
    Возвращает информацию о текущем пользователе.
    """
    logger.info("Запрос информации о текущем пользователе: %s", current_user.email)
    return {"email": current_user.email}

# Пример защищенного маршрута
@router.get("/protected-route")
def protected_route(current_user: User = Depends(get_current_user)):
    """
    Пример защищенного маршрута, доступного только авторизованным пользователям.
    """
    logger.info("Доступ к защищенному маршруту предоставлен пользователю: %s", current_user.email)
    return {"message": "Вы авторизованы!", "email": current_user.email}

# Обновление профиля пользователя
@router.put("/update_profile")
def update_profile(user_update: UserUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Обновление профиля пользователя.
    """
    user = get_current_user_info(db, current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user_update.full_name:
        user.full_name = user_update.full_name
    if user_update.password:
        user.password_hash = hash_password(user_update.password)
    user.updated_at = datetime.utcnow()  # Обновление времени
    db.commit()
    return {"message": "Профиль успешно обновлен"}
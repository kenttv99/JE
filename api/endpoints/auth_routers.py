import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import timedelta

from api.auth import create_access_token, verify_password, hash_password, get_current_user
from database.init_db import SessionLocal, User

# Настройка логирования
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Создаем роутер
router = APIRouter()

# Модель для входа
class LoginRequest(BaseModel):
    email: str
    password: str

# Модель для регистрации
class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str

# Обработчик регистрации
@router.post("/register")
def register_user(request: RegisterRequest):
    db = SessionLocal()
    try:
        logger.info("Регистрация пользователя с email: %s", request.email)
        # Проверяем, есть ли пользователь с таким email
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            logger.warning("Регистрация не удалась: email %s уже зарегистрирован", request.email)
            raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
        
        # Хэшируем пароль и создаем нового пользователя
        hashed_password = hash_password(request.password)
        new_user = User(email=request.email, password_hash=hashed_password, full_name=request.full_name)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        logger.info("Пользователь %s успешно зарегистрирован", request.email)
        return {"message": "Пользователь успешно зарегистрирован"}
    finally:
        db.close()

# Обработчик входа
@router.post("/login")
def login_user(request: LoginRequest):
    db = SessionLocal()
    try:
        logger.info("Попытка входа пользователя с email: %s", request.email)
        # Проверяем существование пользователя
        user = db.query(User).filter(User.email == request.email).first()
        if not user or not verify_password(request.password, user.password_hash):
            logger.warning("Неудачная попытка входа: неверный email или пароль для %s", request.email)
            raise HTTPException(status_code=401, detail="Неверный email или пароль")
        
        # Создаем токен доступа
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
        logger.info("Пользователь %s успешно вошел в систему", request.email)
        return {"access_token": access_token, "token_type": "bearer"}
    finally:
        db.close()

# Получение информации о текущем пользователе
@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    logger.info("Запрос информации о текущем пользователе: %s", current_user["email"])
    return {"email": current_user["email"]}

# Пример защищенного маршрута
@router.get("/protected-route")
def protected_route(current_user: dict = Depends(get_current_user)):
    logger.info("Доступ к защищенному маршруту предоставлен пользователю: %s", current_user["email"])
    return {"message": "Вы авторизованы!", "email": current_user["email"]}
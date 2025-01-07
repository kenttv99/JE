from sqlalchemy.orm import Session
from fastapi import HTTPException, Depends
from database.init_db import User, SessionLocal

def get_current_user_info(db: Session, current_user: User):
    """
    Получение информации о текущем пользователе.
    """
    user = db.query(User).filter(User.email == current_user.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    return user

def get_user_by_email(db: Session, email: str):
    """
    Получение пользователя по email.
    """
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int):
    """
    Получение пользователя по ID.
    """
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, email: str, hashed_password: str, full_name: str = None):
    """
    Создание нового пользователя.
    """
    new_user = User(email=email, password_hash=hashed_password, full_name=full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def delete_user(db: Session, user_id: int):
    """
    Удаление пользователя по ID.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()

def get_db():
    """
    Получение сессии базы данных.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

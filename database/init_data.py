from datetime import datetime
from sqlalchemy.orm import Session
from api.auth import hash_password
from database.init_db import Role, User

def init_roles(db: Session):
    """
    Инициализация ролей.
    """
    if db.query(Role).count() == 0:
        roles = [
            Role(name="admin", description="Administrator role"),
            Role(name="trader", description="Trader role"),
            Role(name="user", description="Regular user role"),
        ]
        db.add_all(roles)
        db.commit()

def init_users(db: Session):
    """
    Инициализация пользователей.
    """
    if db.query(User).count() == 0:
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        example_user = User(
            email="admin@example.com",
            password_hash=hash_password("admin_password"),  # Используем функцию хэширования пароля
            full_name="Admin User",
            role_id=admin_role.id,
            is_superuser=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(example_user)
        db.commit()

def init_data(db: Session):
    """
    Общая инициализация данных.
    """
    init_roles(db)
    init_users(db)
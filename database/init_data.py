import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from api.auth import hash_password

# Настройка логирования
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def init_roles(db: Session):
    """
    Инициализация ролей.
    """
    from database.init_db import Role  # Ленивый импорт

    if db.query(Role).count() == 0:
        roles = [
            Role(name="admin", description="Administrator role"),
            Role(name="trader", description="Trader role"),
            Role(name="user", description="Regular user role"),
        ]
        db.add_all(roles)
        db.commit()
        logger.info("Roles have been initialized")
    else:
        logger.info("Roles already exist")

def init_users(db: Session):
    """
    Инициализация пользователей.
    """
    from database.init_db import User, Role  # Ленивый импорт

    if db.query(User).count() == 0:
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if admin_role:
            example_user = User(
                email="admin@example.com",
                password_hash=hash_password("admin_password"),  # Используем функцию хэширования пароля
                full_name="Admin User",
                role_id=admin_role.id,
                is_superuser=True,
                created_at=datetime.now(timezone.utc),  # Используем timezone-aware datetime
                updated_at=datetime.now(timezone.utc)   # Используем timezone-aware datetime
            )
            db.add(example_user)
            db.commit()
            logger.info("Admin user has been initialized")
        else:
            logger.error("Admin role does not exist")
    else:
        logger.info("Users already exist")

def init_data(db: Session):
    """
    Общая инициализация данных.
    """
    init_roles(db)
    init_users(db)

if __name__ == "__main__":
    from database.init_db import SessionLocal

    # Инициализация данных
    db = SessionLocal()
    try:
        init_data(db)
    finally:
        db.close()
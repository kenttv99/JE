from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from database.init_db import User

async def get_current_user_info(db: AsyncSession, current_user: User) -> User:
    """Получает информацию о текущем пользователе."""
    stmt = select(User).where(User.id == current_user.id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

async def get_user_by_email(db: AsyncSession, email: str):
    """Ищет пользователя по email."""
    result = await db.execute(select(User).filter(User.email == email))
    return result.scalars().first()

async def get_user_by_id(db: AsyncSession, user_id: int):
    """Ищет пользователя по ID."""
    result = await db.execute(select(User).filter(User.id == user_id))
    return result.scalars().first()

async def create_user(db: AsyncSession, email: str, hashed_password: str, full_name: str = None):
    """Создает нового пользователя с указанными данными."""
    new_user = User(email=email, password_hash=hashed_password, full_name=full_name)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

async def delete_user(db: AsyncSession, user_id: int):
    """Удаляет пользователя по ID."""
    user = await get_user_by_id(db, user_id)
    if user:
        await db.delete(user)
        await db.commit()
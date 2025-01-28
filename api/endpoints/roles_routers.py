from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database.init_db import Role, get_async_db
from api.schemas import RoleCreate, RoleResponse

router = APIRouter()

@router.post("/create_role", response_model=RoleResponse)
async def create_role(role: RoleCreate, db: AsyncSession = Depends(get_async_db)):
    """
    Создание новой роли (асинхронная версия).

    :param role: RoleCreate - Схема создания роли.
    :param db: AsyncSession - Асинхронная сессия базы данных.
    :return: RoleResponse - Схема ответа с созданной ролью.
    """
    # Проверяем наличие роли с тем же именем
    stmt = select(Role).where(Role.name == role.name)
    result = await db.execute(stmt)
    db_role = result.scalars().first()

    if db_role:
        raise HTTPException(status_code=400, detail="Роль уже существует")

    new_role = Role(name=role.name, description=role.description)
    db.add(new_role)
    await db.commit()
    await db.refresh(new_role)
    return new_role

@router.get("/get_roles", response_model=List[RoleResponse])
async def get_roles(skip: int = 0, limit: int = 10, db: AsyncSession = Depends(get_async_db)):
    """
    Получение списка ролей с пагинацией (асинхронная версия).

    :param skip: int - Количество записей, которые нужно пропустить.
    :param limit: int - Максимальное количество записей для возврата.
    :param db: AsyncSession - Асинхронная сессия базы данных.
    :return: List[RoleResponse] - Список схем ответов с ролями.
    """
    stmt = select(Role).offset(skip).limit(limit)
    result = await db.execute(stmt)
    roles = result.scalars().all()
    return roles

@router.get("/get_role/{role_id}", response_model=RoleResponse)
async def get_role(role_id: int, db: AsyncSession = Depends(get_async_db)):
    """
    Получение конкретной роли по ID (асинхронная версия).

    :param role_id: int - ID роли для получения.
    :param db: AsyncSession - Асинхронная сессия базы данных.
    :return: RoleResponse - Схема ответа с ролью.
    """
    stmt = select(Role).where(Role.id == role_id)
    result = await db.execute(stmt)
    role = result.scalars().first()

    if role is None:
        raise HTTPException(status_code=404, detail="Роль не найдена")

    return role

@router.put("/update_role/{role_id}", response_model=RoleResponse)
async def update_role(role_id: int, updated_role: RoleCreate, db: AsyncSession = Depends(get_async_db)):
    """
    Обновление конкретной роли по ID (асинхронная версия).

    :param role_id: int - ID роли для обновления.
    :param updated_role: RoleCreate - Схема обновления роли.
    :param db: AsyncSession - Асинхронная сессия базы данных.
    :return: RoleResponse - Схема ответа с обновленной ролью.
    """
    stmt = select(Role).where(Role.id == role_id)
    result = await db.execute(stmt)
    role = result.scalars().first()

    if role is None:
        raise HTTPException(status_code=404, detail="Роль не найдена")

    role.name = updated_role.name
    role.description = updated_role.description
    await db.commit()
    await db.refresh(role)
    return role

@router.delete("/delete_role/{role_id}")
async def delete_role(role_id: int, db: AsyncSession = Depends(get_async_db)):
    """
    Удаление конкретной роли по ID (асинхронная версия).

    :param role_id: int - ID роли для удаления.
    :param db: AsyncSession - Асинхронная сессия базы данных.
    :return: dict - Сообщение об успешном удалении.
    """
    stmt = select(Role).where(Role.id == role_id)
    result = await db.execute(stmt)
    role = result.scalars().first()

    if role is None:
        raise HTTPException(status_code=404, detail="Роль не найдена")

    await db.delete(role)
    await db.commit()
    return {"message": "Роль успешно удалена"}
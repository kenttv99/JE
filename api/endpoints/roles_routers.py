from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.init_db import Role
from api.utils.user_utils import get_db  # Исправленный импорт
from api.schemas import RoleCreate, RoleResponse
from typing import List

router = APIRouter()

@router.post("/roles", response_model=RoleResponse)
def create_role(role: RoleCreate, db: Session = Depends(get_db)):
    """
    Создание новой роли.

    :param role: RoleCreate - Схема создания роли.
    :param db: Session - Сессия базы данных.
    :return: RoleResponse - Схема ответа с созданной ролью.
    """
    db_role = db.query(Role).filter(Role.name == role.name).first()
    if db_role:
        raise HTTPException(status_code=400, detail="Роль уже существует")
    new_role = Role(name=role.name, description=role.description)
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

@router.get("/roles", response_model=List[RoleResponse])
def get_roles(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Получение списка ролей с пагинацией.

    :param skip: int - Количество записей, которые нужно пропустить.
    :param limit: int - Максимальное количество записей для возврата.
    :param db: Session - Сессия базы данных.
    :return: List[RoleResponse] - Список схем ответов с ролями.
    """
    roles = db.query(Role).offset(skip).limit(limit).all()
    return roles

@router.get("/roles/{role_id}", response_model=RoleResponse)
def get_role(role_id: int, db: Session = Depends(get_db)):
    """
    Получение конкретной роли по ID.

    :param role_id: int - ID роли для получения.
    :param db: Session - Сессия базы данных.
    :return: RoleResponse - Схема ответа с ролью.
    """
    role = db.query(Role).filter(Role.id == role_id).first()
    if role is None:
        raise HTTPException(status_code=404, detail="Роль не найдена")
    return role

@router.put("/roles/{role_id}", response_model=RoleResponse)
def update_role(role_id: int, updated_role: RoleCreate, db: Session = Depends(get_db)):
    """
    Обновление конкретной роли по ID.

    :param role_id: int - ID роли для обновления.
    :param updated_role: RoleCreate - Схема обновления роли.
    :param db: Session - Сессия базы данных.
    :return: RoleResponse - Схема ответа с обновленной ролью.
    """
    role = db.query(Role).filter(Role.id == role_id).first()
    if role is None:
        raise HTTPException(status_code=404, detail="Роль не найдена")
    role.name = updated_role.name
    role.description = updated_role.description
    db.commit()
    db.refresh(role)
    return role

@router.delete("/roles/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):
    """
    Удаление конкретной роли по ID.

    :param role_id: int - ID роли для удаления.
    :param db: Session - Сессия базы данных.
    :return: dict - Сообщение об успешном удалении.
    """
    role = db.query(Role).filter(Role.id == role_id).first()
    if role is None:
        raise HTTPException(status_code=404, detail="Роль не найдена")
    db.delete(role)
    db.commit()
    return {"message": "Роль успешно удалена"}
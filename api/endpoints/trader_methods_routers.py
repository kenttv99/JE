from datetime import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from database.init_db import get_async_db, Method, Trader
from api.schemas import MethodCreateRequest, MethodResponse, TraderResponse

# Setup logging
from config.logging_config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/add_method", response_model=MethodResponse)
async def add_method(request: MethodCreateRequest, db: AsyncSession = Depends(get_async_db)):
    """Add a new method."""
    logger.info("Adding method with name: %s", request.name)
    
    new_method = Method(
        name=request.name,
        details=request.details,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_method)
    
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error("Error adding method %s: %s", request.name, e)
        raise HTTPException(status_code=500, detail="Error adding method")
    
    await db.refresh(new_method)
    logger.info("Method %s added successfully", request.name)
    return new_method

@router.delete("/{method_id}")
async def delete_method(method_id: int, db: AsyncSession = Depends(get_async_db)):
    """Delete a method."""
    logger.info("Deleting method with ID: %d", method_id)
    
    result = await db.execute(select(Method).filter(Method.id == method_id))
    method = result.scalars().first()
    if not method:
        logger.warning("Method with ID %d not found", method_id)
        raise HTTPException(status_code=404, detail="Method not found")
    
    await db.delete(method)
    
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error("Error deleting method %d: %s", method_id, e)
        raise HTTPException(status_code=500, detail="Error deleting method")
    
    logger.info("Method %d deleted successfully", method_id)
    return {"message": "Method deleted successfully"}

@router.get("/get_methods", response_model=List[MethodResponse])
async def get_all_methods(db: AsyncSession = Depends(get_async_db)):
    """Get all methods."""
    logger.info("Getting all methods")
    
    result = await db.execute(select(Method))
    methods = result.scalars().all()
    
    if not methods:
        logger.warning("No methods found")
        raise HTTPException(status_code=404, detail="No methods found")
    
    return methods

@router.get("/get_{method_id}", response_model=MethodResponse)
async def get_method(method_id: int, db: AsyncSession = Depends(get_async_db)):
    """Get details of a method."""
    logger.info("Getting details of method with ID: %d", method_id)
    
    result = await db.execute(select(Method).filter(Method.id == method_id))
    method = result.scalars().first()
    
    if not method:
        logger.warning("Method with ID %d not found", method_id)
        raise HTTPException(status_code=404, detail="Method not found")
    
    return method
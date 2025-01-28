from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi import HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.init_db import User, Trader, get_async_db  # Added Trader
from api.schemas import TokenData
from constants import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def hash_password(password: str) -> str:
    """Хэширует пароль с использованием bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет соответствие пароля и его хэша."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Создает JWT токен с истечением срока действия."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_async_db)):
    """Получает текущего пользователя по JWT токену."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email: Optional[str] = payload.get("sub")
        if user_email is None:
            raise HTTPException(status_code=401, detail="Не удалось проверить токен")
        token_data = TokenData(email=user_email)
    except JWTError:
        raise HTTPException(status_code=401, detail="Не удалось проверить токен")

    result = await db.execute(select(User).filter(User.email == token_data.email))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    return user


async def get_current_trader(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_async_db)):
    """Gets the current trader by JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email: Optional[str] = payload.get("sub")
        if user_email is None:
            raise HTTPException(status_code=401, detail="Could not validate token")
        token_data = TokenData(email=user_email)
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate token")

    result = await db.execute(select(Trader).filter(Trader.email == token_data.email))
    trader = result.scalars().first()
    if trader is None:
        raise HTTPException(status_code=401, detail="Trader not found")
    return trader

async def get_current_active_trader(current_trader: Trader = Depends(get_current_trader)):
    """Check if the trader is active and has access."""
    if not current_trader.access:
        raise HTTPException(status_code=403, detail="Trader account is disabled")
    return current_trader

def create_trader_token(trader: Trader) -> str:
    """Create a JWT token specifically for traders."""
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_access_token(
        data={
            "sub": trader.email,
            "type": "trader",
            "verification_level": trader.verification_level
        },
        expires_delta=access_token_expires
    )
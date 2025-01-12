# constants.py

"""
Модуль с константами проекта
"""

# Используется в database/init_db.py и database/drop_db.py
DATABASE_URL = "postgresql+asyncpg://postgres:assasin88@localhost:5432/crypto_exchange"

# Все три константы используются в api/auth.py
SECRET_KEY = "123456789"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Используется в api/endpoints/garantex_api.py
GARANTEX_API_URL = "https://garantex.org/api/v2/depth"
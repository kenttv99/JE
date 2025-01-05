from fastapi import APIRouter, HTTPException
from psycopg2 import connect, OperationalError, sql
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor
from api.garantex_api import fetch_garantex_rates

router = APIRouter()

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)

def connect_to_db():
    try:
        conn = connect(
            dbname="crypto_exchange",
            user="postgres",
            password="your_password",
            host="localhost",
            port="5432"
        )
        logging.info("Успешное подключение к базе данных.")
        return conn
    except OperationalError as e:
        logging.error(f"Ошибка подключения к базе данных: {e}")
        raise HTTPException(status_code=500, detail="Ошибка базы данных")

# Конфигурация базы данных
DB_CONFIG = {
    "dbname": "crypto_exchange",
    "user": "postgres",
    "password": "assasin88",
    "host": "localhost",
    "port": "5432",
}

# Модели данных
class User(BaseModel):
    email: str
    password: str
    full_name: str | None = None

class DeleteUser(BaseModel):
    email: str

# Корневой маршрут
@router.get("/")
async def root():
    return {"message": "Добро пожаловать на сервер криптообменника!"}

# Проверка здоровья сервера
@router.get("/health")
async def health_check():
    return {"status": "ok"}

# Создание пользователя
@router.post("/add_user")
async def create_user(user: User):
    conn = connect_to_db()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к базе данных")

    try:
        cursor = conn.cursor()
        query = """
        INSERT INTO users (email, password_hash, full_name)
        VALUES (%s, crypt(%s, gen_salt('bf')), %s)
        RETURNING id;
        """
        cursor.execute(query, (user.email, user.password, user.full_name))
        user_id = cursor.fetchone()[0]
        conn.commit()
        return {"message": "Пользователь создан", "user_id": user_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка создания пользователя: {e}")
    finally:
        conn.close()

# Получение списка пользователей
@router.get("/users")
async def get_users():
    conn = connect_to_db()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к базе данных")

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT id, email, full_name, created_at FROM users;")
        users = cursor.fetchall()
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения пользователей: {e}")
    finally:
        conn.close()

# Удаление пользователя
@router.delete("/delete_user")
async def delete_user(user: DeleteUser):
    conn = connect_to_db()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к базе данных")

    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE email = %s;", (user.email,))
        conn.commit()
        return {"message": "Пользователь удален"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка удаления пользователя: {e}")
    finally:
        conn.close()


# Обновление курсов в базе данных
@router.post("/update_rates")
async def update_exchange_rates():
    logging.info("Начата процедура обновления курсов")
    conn = connect_to_db()
    if not conn:
        logging.error("Ошибка подключения к базе данных")
        raise HTTPException(status_code=500, detail="Ошибка подключения к базе данных")
    
    rates = fetch_garantex_rates()
    if not rates:
        logging.error("Не удалось получить курсы с Garantex")
        raise HTTPException(status_code=500, detail="Не удалось получить курсы с Garantex")

    try:
        cursor = conn.cursor()

        # очистка таблицы перед записью
        cursor.execute("TRUNCATE TABLE exchange_rates;")
        query = """
        INSERT INTO exchange_rates (currency, buy_rate, sell_rate, source, updated_at)
        VALUES ('USDT', %s, %s, 'Garantex', CURRENT_TIMESTAMP)
        ON CONFLICT (id) 
        DO UPDATE SET
            buy_rate = EXCLUDED.buy_rate,
            sell_rate = EXCLUDED.sell_rate,
            updated_at = CURRENT_TIMESTAMP;
        """
        cursor.execute(query, (rates["buy_rate"], rates["sell_rate"]))
        conn.commit()
        logging.info("Курсы успешно обновлены в базе данных")
        return {"message": "Курсы успешно обновлены"}
    except Exception as e:
        conn.rollback()
        logging.error(f"Ошибка обновления курсов: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка обновления курсов: {e}")
    finally:
        conn.close()

# Получение актуальных курсов
@router.get("/get_rates")
async def get_exchange_rates():
    logging.info("Запрос на получение курсов")
    conn = connect_to_db()
    if not conn:
        logging.error("Ошибка подключения к базе данных")
        raise HTTPException(status_code=500, detail="Ошибка подключения к базе данных")

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = "SELECT currency, buy_rate, sell_rate, updated_at FROM exchange_rates;"
        cursor.execute(query)
        rates = cursor.fetchall()
        logging.info("Курсы успешно получены из базы данных")
        return rates
    except Exception as e:
        logging.error(f"Ошибка получения курсов: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка получения курсов: {e}")
    finally:
        conn.close()

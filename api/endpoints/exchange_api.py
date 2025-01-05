from fastapi import APIRouter, HTTPException
from psycopg2 import connect, OperationalError
import logging
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor
from api.garantex_api import fetch_garantex_rates

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)

# Конфигурация базы данных
DB_CONFIG = {
    "dbname": "crypto_exchange",
    "user": "postgres",
    "password": "assasin88",
    "host": "localhost",
    "port": "5432",
}

def connect_to_db():
    """Функция для подключения к базе данных."""
    try:
        conn = connect(**DB_CONFIG)
        logging.info("Успешное подключение к базе данных.")
        return conn
    except OperationalError as e:
        logging.error(f"Ошибка подключения к базе данных: {e}")
        raise HTTPException(status_code=500, detail="Ошибка базы данных")

# Инициализация роутера
router = APIRouter()

# Модели данных
class User(BaseModel):
    email: str
    password: str
    full_name: str | None = None

class DeleteUser(BaseModel):
    email: str
    
class ExchangeOrder(BaseModel):
    user_id: int
    order_type: str # "buy" or "sell"
    currency: str # "BTC" or "USDT"
    amount: float
    total_rub: float
    
class OrderFilter(BaseModel):
    user_id: int

# Эндпоинт проверки здоровья сервера
@router.get("/health")
async def health_check():
    logging.info("Выполнена проверка здоровья сервера.")
    return {"status": "ok"}

# Эндпоинт для создания пользователя
@router.post("/add_user")
async def create_user(user: User):
    conn = connect_to_db()
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
        logging.info(f"Пользователь {user.email} успешно создан.")
        return {"message": "Пользователь создан", "user_id": user_id}
    except Exception as e:
        conn.rollback()
        logging.error(f"Ошибка создания пользователя: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка создания пользователя: {e}")
    finally:
        conn.close()

# Эндпоинт для получения списка пользователей
@router.get("/users")
async def get_users():
    conn = connect_to_db()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT id, email, full_name, created_at FROM users;")
        users = cursor.fetchall()
        logging.info("Список пользователей успешно получен.")
        return users
    except Exception as e:
        logging.error(f"Ошибка получения пользователей: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка получения пользователей: {e}")
    finally:
        conn.close()

# Эндпоинт для удаления пользователя
@router.delete("/delete_user")
async def delete_user(user: DeleteUser):
    conn = connect_to_db()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE email = %s;", (user.email,))
        conn.commit()
        logging.info(f"Пользователь {user.email} успешно удален.")
        return {"message": "Пользователь удален"}
    except Exception as e:
        conn.rollback()
        logging.error(f"Ошибка удаления пользователя: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка удаления пользователя: {e}")
    finally:
        conn.close()

# Эндпоинт для обновления курсов
@router.post("/update_rates")
async def update_exchange_rates():
    logging.info("Начата процедура обновления курсов.")
    conn = connect_to_db()
    try:
        rates = fetch_garantex_rates()
        if not rates:
            logging.error("Не удалось получить курсы с Garantex.")
            raise HTTPException(status_code=500, detail="Не удалось получить курсы с Garantex")
        
        cursor = conn.cursor()
        cursor.execute("TRUNCATE TABLE exchange_rates;")
        query = """
        INSERT INTO exchange_rates (currency, buy_rate, sell_rate, source, updated_at)
        VALUES ('USDT', %s, %s, 'Garantex', CURRENT_TIMESTAMP);
        """
        cursor.execute(query, (rates["buy_rate"], rates["sell_rate"]))
        conn.commit()
        logging.info("Курсы успешно обновлены в базе данных.")
        return {"message": "Курсы успешно обновлены"}
    except Exception as e:
        conn.rollback()
        logging.error(f"Ошибка обновления курсов: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка обновления курсов: {e}")
    finally:
        conn.close()

# Эндпоинт для получения курсов
@router.get("/get_rates")
async def get_exchange_rates():
    logging.info("Запрос на получение курсов.")
    conn = connect_to_db()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT currency, buy_rate, sell_rate, updated_at FROM exchange_rates;")
        rates = cursor.fetchall()
        logging.info("Курсы успешно получены из базы данных.")
        return rates
    except Exception as e:
        logging.error(f"Ошибка получения курсов: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка получения курсов: {e}")
    finally:
        conn.close()
        
# Эндпоинт для создания заявки на обмен
@router.post("/create_order")
async def create_exchange_order(order: ExchangeOrder):
    conn = connect_to_db()
    try:
        cursor = conn.cursor()
        query = """
        INSERT INTO exchange_orders (user_id, order_type, currency, amount, total_rub, status, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id;
        """
        cursor.execute(query, (order.user_id, order.order_type, order.currency, order.amount, order.total_rub))
        order_id = cursor.fetchone()[0]
        conn.commit()
        return {"message": "Заявка на обмен успешно создана", "order_id": order_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка создания заявки: {e}")
    finally:
        conn.close()
        
# Эндпоинт для получения заявок на обмен        
@router.post("/get_orders")
async def get_exchange_orders(filter: OrderFilter):
    conn = connect_to_db()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = """
        SELECT id, user_id, order_type, currency, amount, total_rub, status, created_at, updated_at
        FROM exchange_orders
        WHERE user_id = %s
        ORDER BY created_at DESC;
        """
        cursor.execute(query, (filter.user_id,))
        orders = cursor.fetchall()
        return orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения заявок: {e}")
    finally:
        conn.close()

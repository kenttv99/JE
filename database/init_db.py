import psycopg2
from psycopg2 import sql, OperationalError
import logging

#Настройка логирования
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

def connect_to_db():
    # Коннект к базе данных
    try:
        conn = psycopg2.connect(
            dbname = "crypto_exchange",
            user = "postgres",
            password = "assasin88",
            host = "localhost",
            port = "5432"
        )
        logging.info("Sucsessful DB connetction")
        return conn
    except OperationalError as e:
        logging.error(f"Ошибка подключения к базе данных: {e}")
        raise
    
def create_tables():
    # Создание таблиц
    queries = [
        """
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE exchange_rates (
            id SERIAL PRIMARY KEY,
            currency VARCHAR(10) NOT NULL,
            buy_rate DECIMAL(20, 8) NOT NULL,
            sell_rate DECIMAL(20, 8) NOT NULL,
            source VARCHAR(255) NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE exchange_orders (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id),
            order_type VARCHAR(10) CHECK (order_type IN ('buy', 'sell')),
            currency VARCHAR(10) NOT NULL,
            amount DECIMAL(20, 8) NOT NULL,
            total_rub DECIMAL(20, 2) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE payments (
            id SERIAL PRIMARY KEY,
            order_id INT REFERENCES exchange_orders(id),
            payment_method VARCHAR(50),
            payment_details TEXT,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    ]
    conn = connect_to_db()
    cursor = conn.cursor()

    try:
        for i, query in enumerate(queries):
            cursor.execute(query)
            logging.info(f"Таблица {i+1} успешно создана или уже сущестует.")
        conn.commit()
        logging.info("Все таблицы успешно созданы")
    except Exception as e:
        logging.info(f"Ошибка при создании таблиц: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    create_tables()
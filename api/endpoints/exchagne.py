from fastapi import APIRouter, HTTPException
from psycopg2 import connect, OperationalError, sql
import logging

router = APIRouter()

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

# Получение курсов валют
@router.get("/rates")
def get_exchange_rates():
    conn = connect_to_db()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT currency, buy_rate, sell_rate FROM exchange_rates;")
        rates = cursor.fetchall()
        if not rates:
            raise HTTPException(status_code=404, detail="Курсы валют не найдены")
        return {"rates": [{"currency": r[0], "buy_rate": r[1], "sell_rate": r[2]} for r in rates]}
    except Exception as e:
        logging.error(f"Ошибка при получении курсов: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")
    finally:
        cursor.close()
        conn.close()

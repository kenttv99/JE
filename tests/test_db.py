from sqlalchemy.orm import Session
import logging
import sys
import os

# Добавляем путь к корню проекта
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.init_db import SessionLocal, User, ExchangeRate, ExchangeOrder, Payment, OrderStatus

# Настройка логирования
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

def test_db_operations():
    # Создаем сессию для работы с базой данных
    session: Session = SessionLocal()

    try:
        logging.info("Тест 1: Добавление пользователя...")
        test_user = User(email="testuser@example.com", password_hash="hashed_password", full_name="Test User")
        session.add(test_user)
        session.commit()
        session.refresh(test_user)
        logging.info(f"Пользователь добавлен: ID={test_user.id}, Email={test_user.email}")

        logging.info("Тест 2: Добавление курса обмена...")
        test_rate = ExchangeRate(currency="USDT", buy_rate=75.50, sell_rate=74.80, source="TestSource")
        session.add(test_rate)
        session.commit()
        session.refresh(test_rate)
        logging.info(f"Курс обмена добавлен: ID={test_rate.id}, Валюта={test_rate.currency}")

        logging.info("Тест 3: Создание заявки...")
        test_order = ExchangeOrder(
            user_id=test_user.id,
            order_type="buy",
            currency="USDT",
            amount=100.0,
            total_rub=7550.0,
            status=OrderStatus.pending
        )
        session.add(test_order)
        session.commit()
        session.refresh(test_order)
        logging.info(f"Заявка добавлена: ID={test_order.id}, Тип={test_order.order_type}, Статус={test_order.status}")

        logging.info("Тест 4: Создание платежа...")
        test_payment = Payment(
            order_id=test_order.id,
            payment_method="card",
            bank="Test Bank",
            payment_details="1234-5678-9012-3456",
            status=OrderStatus.processing
        )
        session.add(test_payment)
        session.commit()
        session.refresh(test_payment)
        logging.info(f"Платеж добавлен: ID={test_payment.id}, Метод={test_payment.payment_method}, Статус={test_payment.status}")

        logging.info("Проверка данных в таблицах...")

        users = session.query(User).all()
        logging.info(f"Все пользователи: {users}")

        rates = session.query(ExchangeRate).all()
        logging.info(f"Все курсы обмена: {rates}")

        orders = session.query(ExchangeOrder).all()
        logging.info(f"Все заявки: {orders}")

        payments = session.query(Payment).all()
        logging.info(f"Все платежи: {payments}")

        logging.info("Тестирование успешно завершено.")

    except Exception as e:
        logging.error(f"Ошибка при тестировании: {e}")
        session.rollback()
    finally:
        session.close()


if __name__ == "__main__":
    test_db_operations()
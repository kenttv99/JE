import psycopg2

# Настройки подключения к базе данных
DB_CONFIG = {
    "dbname": "crypto_exchange",
    "user": "postgres",
    "password": "assasin88",
    "host": "localhost",
    "port": "5432",
}

# Подключение к базе данных
try:
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    print("Подключение к базе данных успешно")
except Exception as e:
    print(f"Ошибка подключения к базе данных: {e}")
    exit()

# Тест добавления пользователя
# try:
#     cursor.execute(
#         """
#         INSERT INTO users (email, password_hash, full_name)
#         VALUES (%s, %s, %s) RETURNING id;
#         """,
#         ("test@example.com", "hashed_password", "Test User")
#     )
#     user_id = cursor.fetchone()[0]
#     conn.commit()
#     print(f"Пользователь успешно добавлен с ID: {user_id}")
# except Exception as e:
#     print(f"Ошибка добавления пользователя: {e}")

# Тест удаления пользователя
try:
    cursor.execute(
        "DELETE FROM users WHERE email = %s RETURNING id;",
        ("test@example.com",)
    )
    deleted_id = cursor.fetchone()
    conn.commit()
    if deleted_id:
        print(f"Пользователь с ID {deleted_id[0]} успешно удален")
    else:
        print("Пользователь для удаления не найден")
except Exception as e:
    print(f"Ошибка удаления пользователя: {e}")

# Закрытие соединения
cursor.close()
conn.close()
print("Соединение с базой данных закрыто")

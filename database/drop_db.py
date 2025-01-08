from sqlalchemy import create_engine, MetaData

DATABASE_URL = "postgresql://postgres:assasin88@localhost:5432/crypto_exchange"
engine = create_engine(DATABASE_URL)
meta = MetaData()

# Отражение всех таблиц
meta.reflect(bind=engine)
meta.drop_all(bind=engine)

print("Все таблицы успешно удалены.")
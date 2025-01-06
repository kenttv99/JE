import requests
import logging
import json

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)

GARANTEX_API_URL = "https://garantex.org/api/v2/depth"

def fetch_garantex_rates():
    try:
        logging.info("Запрос курсов с Garantex начат")
        response = requests.get(GARANTEX_API_URL, params={"market": "usdtrub"})
        response.raise_for_status()
        data = response.json()
        with open("rates.json", "w") as file:
            json.dump(data, file, indent=4)

        buy_rate = float(data["asks"][0]["price"])  # Минимальная цена продажи
        sell_rate = float(data["bids"][0]["price"])  # Максимальная цена покупки
        logging.info(f"Курсы успешно получены: buy_rate={buy_rate}, sell_rate={sell_rate}")
        return {"buy_rate": buy_rate, "sell_rate": sell_rate}
    except Exception as e:
        logging.error(f"Ошибка при запросе курсов: {e}")
        return None
import requests
import logging
import json

from config.logging_config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

GARANTEX_API_URL = "https://garantex.org/api/v2/depth"

def fetch_garantex_rates():
    """
    Функция для получения курсов с Garantex.
    """
    try:
        logger.info("Запрос курсов с Garantex начат")
        response = requests.get(GARANTEX_API_URL, params={"market": "usdtrub"})
        response.raise_for_status()
        data = response.json()
        with open("rates.json", "w") as file:
            json.dump(data, file, indent=4)

        # Извлечение минимальной цены продажи и максимальной цены покупки
        buy_rate = float(data["asks"][0]["price"])
        sell_rate = float(data["bids"][0]["price"])
        logger.info(f"Курсы успешно получены: buy_rate={buy_rate}, sell_rate={sell_rate}")
        return {"buy_rate": buy_rate, "sell_rate": sell_rate}
    except Exception as e:
        logger.error(f"Ошибка при запросе курсов: {e}")
        return None

import httpx
import logging
import json

from config.logging_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)

GARANTEX_API_URL = "https://garantex.org/api/v2/depth"

async def fetch_usdt_rub_garantex_rates():
    """
    Асинхронная функция для получения курсов с Garantex.
    """
    try:
        logger.info("Запрос курсов с Garantex начат")
        async with httpx.AsyncClient() as client:
            response = await client.get(GARANTEX_API_URL, params={"market": "usdtrub"})
            response.raise_for_status()
            data = response.json()

        # Извлечение минимальной цены продажи и максимальной цены покупки
        if data.get("asks") and data.get("bids"):
            buy_rate = float(data["asks"][0]["price"])
            sell_rate = float(data["bids"][0]["price"])
            logger.info(f"Курсы успешно получены: buy_rate={buy_rate}, sell_rate={sell_rate}")
            return {"buy_rate": buy_rate, "sell_rate": sell_rate}
        else:
            logger.warning("Данные о курсах отсутствуют в ответе API.")
            return None
    except httpx.HTTPError as http_err:
        logger.error(f"HTTP ошибка при запросе курсов: {http_err}")
        return None
    except Exception as e:
        logger.error(f"Ошибка при запросе курсов: {e}")
        return None
    

async def fetch_btc_rub_garantex_rates():
    """
    Асинхронная функция для получения курса BTC/USDT с Garantex.
    """
    try:
        logger.info("Запрос курса BTC/USDT с Garantex начат")
        async with httpx.AsyncClient() as client:
            response = await client.get(GARANTEX_API_URL, params={"market": "btcusdt"})
            response.raise_for_status()
            data = response.json()

        if data.get("asks") and data.get("bids"):
            buy_rate = float(data["asks"][0]["price"])
            sell_rate = float(data["bids"][0]["price"])
            logger.info(f"Курс BTC/USDT получен: buy_rate={buy_rate}, sell_rate={sell_rate}")
            return {"buy_rate": buy_rate, "sell_rate": sell_rate}
        else:
            logger.warning("Данные о курсе BTC/USDT отсутствуют в ответе API")
            return None
    except Exception as e:
        logger.error(f"Ошибка при запросе курса BTC/USDT: {e}")
        return None
# api/endpoints/garantex_api.py

import httpx
import logging
# Импорт URL для API Garantex
from constants import GARANTEX_API_URL
from config.logging_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)

async def fetch_usdt_rub_garantex_rates():
    """
    Асинхронная функция для получения курсов USDT/RUB с Garantex.
    """
    try:
        logger.info("Запрос курсов USDT/RUB с Garantex начат")
        async with httpx.AsyncClient() as client:
            response = await client.get(GARANTEX_API_URL, params={"market": "usdtrub"})
            response.raise_for_status()
            data = response.json()

        # Извлечение минимальной цены продажи и максимальной цены покупки
        if data.get("asks") and data.get("bids"):
            buy_rate = float(data["asks"][0]["price"])
            sell_rate = float(data["bids"][0]["price"])
            logger.info(f"Курсы USDT/RUB успешно получены: buy_rate={buy_rate}, sell_rate={sell_rate}")
            return {"buy_rate": buy_rate, "sell_rate": sell_rate, "source": "Garantex"}
        else:
            logger.warning("Данные о курсах USDT/RUB отсутствуют в ответе API.")
            return None
    except httpx.HTTPError as http_err:
        logger.error(f"HTTP ошибка при запросе курсов USDT/RUB: {http_err}")
        return None
    except Exception as e:
        logger.error(f"Ошибка при запросе курсов USDT/RUB: {e}")
        return None

async def fetch_btc_rub_garantex_rates():
    """
    Асинхронная функция для получения курсов BTC/RUB с Garantex.
    """
    try:
        logger.info("Запрос курсов BTC/RUB с Garantex начат")
        async with httpx.AsyncClient() as client:
            response = await client.get(GARANTEX_API_URL, params={"market": "btcrub"})
            response.raise_for_status()
            data = response.json()

        # Извлечение минимальной цены продажи и максимальной цены покупки
        if data.get("asks") and data.get("bids"):
            buy_rate = float(data["asks"][0]["price"])
            sell_rate = float(data["bids"][0]["price"])
            logger.info(f"Курсы BTC/RUB успешно получены: buy_rate={buy_rate}, sell_rate={sell_rate}")
            return {"buy_rate": buy_rate, "sell_rate": sell_rate, "source": "Garantex"}
        else:
            logger.warning("Данные о курсах BTC/RUB отсутствуют в ответе API.")
            return None
    except httpx.HTTPError as http_err:
        logger.error(f"HTTP ошибка при запросе курсов BTC/RUB: {http_err}")
        return None
    except Exception as e:
        logger.error(f"Ошибка при запросе курсов BTC/RUB: {e}")
        return None
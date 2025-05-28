import os
from dotenv import load_dotenv
import requests
from typing import Optional, Tuple, Dict, Any

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_USER_ID = int(os.getenv("ADMIN_USER_ID", 0))


# Initialize Google Maps client if API key is provided

# Django Backend API Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")
API_KEY = os.getenv("API_KEY", "")
API_ENABLED = os.getenv("API_ENABLED", "true").lower() == "true"

# Kyrgyzstan regions and cities with coordinates
REGIONS_CITIES = {
    "Бишкек": ["Бишкек"],
    "Ош": ["Ош"],
    "Чуйская область": [
        "Токмок",
        "Кант",
        "Кара-Балта",
        "Шопоков",
        "Беловодское",
        "Сокулук",
        "Жайыл",
        "Кемин",
        "Панфилов",
        "Московский",
    ],
    "Ошская область": [
        "Узген",
        "Кара-Суу",
        "Ноокат",
        "Кара-Кульджа",
        "Араван",
        "Чон-Алай",
        "Алай",
        "Кызыл-Кия",
    ],
    "Джалал-Абадская область": [
        "Джалал-Абад",
        "Кербен",
        "Майлуу-Суу",
        "Таш-Кумыр",
        "Кок-Жангак",
        "Казарман",
        "Чаткал",
        "Токтогул",
    ],
    "Баткенская область": [
        "Баткен",
        "Сулюкта",
        "Кызыл-Кия",
        "Кадамжай",
        "Лейлек",
        "Кадамжай",
    ],
    "Нарынская область": ["Нарын", "Ат-Башы", "Жумгал", "Кочкор", "Ак-Талаа"],
    "Иссык-Кульская область": [
        "Каракол",
        "Балыкчы",
        "Чолпон-Ата",
        "Кызыл-Суу",
        "Тюп",
        "Ак-Суу",
        "Жети-Огуз",
        "Тон",
    ],
    "Таласская область": ["Талас", "Кара-Буура", "Бакай-Ата", "Манас", "Кызыл-Адыр"],
}

# City coordinates (latitude, longitude) - fallback coordinates


def config_get_coordinates(city_name: str) -> Optional[Dict[str, Any]]:
    """
    Получение координат города через бэкенд API
    """
    if not API_ENABLED:
        return None

    try:
        response = requests.post(
            f"{API_BASE_URL}/api/geocode/",
            json={"city_name": city_name},
            headers={"Authorization": f"Bearer {API_KEY}"} if API_KEY else {},
        )

        if response.status_code == 200:
            return response.json()
        else:
            print(f"Ошибка при получении координат: {response.status_code}")
            return None
    except Exception as e:
        print(f"Ошибка при запросе к API: {e}")
        return None


REPORT_TYPES = ["Жалоба", "Рекомендации"]

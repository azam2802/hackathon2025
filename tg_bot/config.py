import os
from dotenv import load_dotenv
from typing import Optional, Tuple, Dict, Any

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_USER_ID = int(os.getenv("ADMIN_USER_ID", 0))

# Google Maps API Configuration


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
CITY_COORDINATES = {
    # Бишкек
    "Бишкек": (42.8746, 74.5698),
    # Ош
    "Ош": (40.5283, 72.7985),
    # Чуйская область
    "Токмок": (42.8421, 75.3008),
    "Кант": (42.8911, 74.8508),
    "Кара-Балта": (42.8144, 73.8486),
    "Шопоков": (42.8833, 74.8667),
    "Беловодское": (42.8283, 74.1019),
    "Сокулук": (42.6833, 74.2833),
    "Жайыл": (42.9667, 75.7333),
    "Кемин": (42.8500, 75.6333),
    "Панфилов": (42.9167, 75.9167),
    "Московский": (42.8667, 74.6833),
    # Ошская область
    "Узген": (40.7697, 73.3014),
    "Кара-Суу": (40.7042, 72.8653),
    "Ноокат": (39.8742, 72.8181),
    "Кара-Кульджа": (40.5500, 72.9167),
    "Араван": (40.2833, 72.4500),
    "Чон-Алай": (39.9167, 72.9500),
    "Алай": (39.5333, 72.8667),
    "Кызыл-Кия": (40.2567, 72.1281),
    # Джалал-Абадская область
    "Джалал-Абад": (40.9333, 72.9333),
    "Кербен": (41.0167, 72.4833),
    "Майлуу-Суу": (41.0167, 72.4833),
    "Таш-Кумыр": (41.3472, 71.6139),
    "Кок-Жангак": (41.1833, 72.4833),
    "Казарман": (41.4000, 73.5000),
    "Чаткал": (41.7833, 71.0833),
    "Токтогул": (41.8742, 72.9431),
    # Баткенская область
    "Баткен": (40.0617, 70.8181),
    "Сулюкта": (39.9333, 69.5667),
    "Кадамжай": (39.6333, 71.3500),
    "Лейлек": (39.7167, 71.1333),
    # Нарынская область
    "Нарын": (41.4286, 75.9911),
    "Ат-Башы": (41.1667, 75.8167),
    "Жумгал": (41.8000, 75.6000),
    "Кочкор": (42.0500, 75.5833),
    "Ак-Талаа": (41.5833, 75.7833),
    # Иссык-Кульская область
    "Каракол": (42.4906, 78.3931),
    "Балыкчы": (42.4603, 76.1844),
    "Чолпон-Ата": (42.6489, 77.0814),
    "Кызыл-Суу": (42.3500, 78.0167),
    "Тюп": (42.7333, 78.3667),
    "Ак-Суу": (42.5000, 77.5000),
    "Жети-Огуз": (42.4333, 78.2000),
    "Тон": (42.2833, 77.1833),
    # Таласская область
    "Талас": (42.5228, 72.2419),
    "Кара-Буура": (42.7833, 73.6500),
    "Бакай-Ата": (42.8167, 73.1833),
    "Манас": (42.7000, 73.9167),
    "Кызыл-Адыр": (42.4833, 72.1167),
}


def config_get_coordinates(
    city_name: str, street: str = "", house: str = ""
) -> Optional[Dict[str, Any]]:
    """
    Get coordinates for a location using the backend API
    Args:
        city_name: название города
        street: название улицы (опционально)
        house: номер дома (опционально)
    """
    if API_ENABLED:
        try:
            import requests

            params = {"city": city_name}
            if street:
                params["street"] = street
            if house:
                params["house"] = house

            response = requests.get(
                f"{API_BASE_URL}/api/geocode/",
                params=params,
                headers={"Authorization": f"Bearer {API_KEY}"} if API_KEY else {},
            )

            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error from API: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Error calling geocoding API: {e}")

    # Fallback to predefined coordinates
    coordinates = CITY_COORDINATES.get(city_name)
    if coordinates:
        latitude, longitude = coordinates
        address_parts = []
        if house:
            address_parts.append(house)
        if street:
            address_parts.append(street)
        address_parts.append(city_name)
        address_parts.append("Кыргызстан")
        full_address = ", ".join(address_parts)

        return {
            "latitude": latitude,
            "longitude": longitude,
            "address": full_address,
            "source": "fallback_coordinates",
            "warning": "Точные координаты не найдены, использованы координаты центра города",
        }
    return None


REPORT_TYPES = ["Жалоба", "Рекомендации"]

import json
import aiofiles
from datetime import datetime
from typing import Dict, Any, Optional
from geopy.geocoders import Nominatim
from config import config_get_coordinates
from localization import get_text, get_region_name, get_report_type_name


async def format_report(report_data: Dict[str, Any], lang: str = "ru") -> str:
    """Format report data into a readable string"""

    # Get localized field names
    header = get_text("report_header", lang)
    type_field = get_text(
        "report_type_field",
        lang,
        type=get_report_type_name(report_data.get("type", "Не указан"), lang),
    )
    region_field = get_text(
        "report_region_field",
        lang,
        region=get_region_name(report_data.get("region", "Не указан"), lang),
    )
    city_field = get_text(
        "report_city_field", lang, city=report_data.get("city", "Не указан")
    )
    contact_field = get_text(
        "report_contact_field", lang, contact=report_data.get("user_name", "Не указано")
    )
    content_field = get_text(
        "report_content_field",
        lang,
        content=report_data.get("report_text", "Не указан"),
    )
    date_field = get_text(
        "report_date_field",
        lang,
        date=report_data.get("created_at", datetime.now().strftime("%d.%m.%Y %H:%M")),
    )

    # Add photo and solution fields for complaints
    photo_field = ""
    solution_field = ""
    if report_data.get("type") == "Жалоба":
        if report_data.get("photo_data"):
            photo_field = get_text("report_photo_field", lang)
        if report_data.get("solution"):
            solution_field = get_text(
                "report_solution_field",
                lang,
                solution=report_data.get("solution", "Не указано"),
            )

    report_text = f"""
{header}

{type_field}
{region_field}
{city_field}

{contact_field}

{content_field}

{photo_field}
{solution_field}

{date_field}
"""

    return report_text


def format_location_info(
    location_data: Optional[Dict[str, Any]], lang: str = "ru"
) -> str:
    """Format location information"""
    if not location_data:
        return (
            "Местоположение не предоставлено"
            if lang == "ru"
            else "Жайгашкан жери көрсөтүлгөн эмес"
        )

    lat = location_data.get("latitude")
    lon = location_data.get("longitude")
    address = location_data.get(
        "address", "Адрес не определен" if lang == "ru" else "Дареги аныкталбаган"
    )
    source = location_data.get("source", "unknown")

    if lat and lon:
        source_text = ""
        if source == "city_selection":
            source_text = (
                " (по выбранному городу)"
                if lang == "ru"
                else " (тандалган шаар боюнча)"
            )
        elif source == "user_location":
            source_text = (
                " (точное местоположение пользователя)"
                if lang == "ru"
                else " (колдонуучунун так жайгашкан жери)"
            )

        coord_text = "Координаты" if lang == "ru" else "Координаттар"
        addr_text = "Адрес" if lang == "ru" else "Дареги"
        return f"{coord_text}: {lat}, {lon}{source_text}\n{addr_text}: {address}"
    else:
        return (
            "Местоположение не предоставлено"
            if lang == "ru"
            else "Жайгашкан жери көрсөтүлгөн эмес"
        )


def get_city_coordinates(address: str, city: str = "") -> Optional[Dict[str, Any]]:
    """
    Get coordinates for a location
    Args:
        address: полный адрес или название улицы
        city: название города (опционально)
    """
    try:
        # Если передан только город без адреса
        if not address and city:
            return config_get_coordinates(city)

        # Если передан полный адрес
        if address:
            # Если город не указан в адресе, добавляем его
            if city and city not in address:
                full_address = f"{address}, {city}"
            else:
                full_address = address
            return config_get_coordinates(full_address)

        return None
    except Exception as e:
        print(f"Error in get_city_coordinates: {e}")
        # В случае ошибки возвращаем координаты города
        if city:
            return config_get_coordinates(city)
        return None


async def get_address_from_coordinates(latitude: float, longitude: float) -> str:
    """Get address from coordinates using geocoding"""
    try:
        geolocator = Nominatim(user_agent="gov_services_bot")
        location = geolocator.reverse(f"{latitude}, {longitude}")
        return location.address if location else "Адрес не найден"
    except Exception as e:
        print(f"Error getting address: {e}")
        return "Ошибка определения адреса"


async def save_report_to_file(report_data: Dict[str, Any]) -> str:
    """Save report to JSON file and return filename"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = (
        f"reports/report_{timestamp}_{report_data.get('user_id', 'unknown')}.json"
    )

    try:
        # Create reports directory if it doesn't exist
        import os

        os.makedirs("reports", exist_ok=True)

        async with aiofiles.open(filename, "w", encoding="utf-8") as f:
            await f.write(json.dumps(report_data, ensure_ascii=False, indent=2))

        return filename
    except Exception as e:
        print(f"Error saving report: {e}")
        return ""


def validate_report_data(report_data: Dict[str, Any]) -> tuple[bool, str]:
    """Validate report data completeness"""
    required_fields = ["type", "region", "city", "report_text", "user_name"]

    for field in required_fields:
        if not report_data.get(field):
            return False, f"Поле '{field}' не заполнено"

    if len(report_data.get("report_text", "")) < 10:
        return False, "Содержание обращения слишком короткое (минимум 10 символов)"

    if len(report_data.get("user_name", "")) < 2:
        return False, "Контактные данные слишком короткие (минимум 2 символа)"

    return True, "Данные корректны"


def escape_markdown(text: str) -> str:
    """Escape markdown special characters"""
    special_chars = [
        "_",
        "*",
        "[",
        "]",
        "(",
        ")",
        "~",
        "`",
        ">",
        "#",
        "+",
        "-",
        "=",
        "|",
        "{",
        "}",
        ".",
        "!",
    ]
    for char in special_chars:
        text = text.replace(char, f"\\{char}")
    return text

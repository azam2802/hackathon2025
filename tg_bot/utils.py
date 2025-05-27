import json
import aiofiles
from datetime import datetime
from typing import Dict, Any, Optional
from geopy.geocoders import Nominatim
from config import CITY_COORDINATES


async def format_report(report_data: Dict[str, Any]) -> str:
    """Format report data into a readable string"""
    
    report_text = f"""
📋 **ОБРАЩЕНИЕ ПО ГОСУДАРСТВЕННЫМ УСЛУГАМ**

🏷️ **Тип обращения:** {report_data.get('type', 'Не указан')}
🌍 **Регион:** {report_data.get('region', 'Не указан')}
🏙️ **Населенный пункт:** {report_data.get('city', 'Не указан')}

👤 **Контактные данные:** {report_data.get('user_name', 'Не указано')}
📱 **ID пользователя:** {report_data.get('user_id', 'Не указан')}

📝 **Содержание обращения:**
{report_data.get('report_text', 'Не указан')}

📍 **Местоположение:**
{format_location_info(report_data.get('location'))}

🕐 **Дата регистрации:** {report_data.get('created_at', datetime.now().strftime('%d.%m.%Y %H:%M'))}
"""
    
    return report_text


def format_location_info(location_data: Optional[Dict[str, Any]]) -> str:
    """Format location information"""
    if not location_data:
        return "Местоположение не предоставлено"
    
    lat = location_data.get('latitude')
    lon = location_data.get('longitude')
    address = location_data.get('address', 'Адрес не определен')
    source = location_data.get('source', 'unknown')
    
    if lat and lon:
        source_text = ""
        if source == "city_selection":
            source_text = " (по выбранному городу)"
        elif source == "user_location":
            source_text = " (точное местоположение пользователя)"
        
        return f"Координаты: {lat}, {lon}{source_text}\nАдрес: {address}"
    else:
        return "Местоположение не предоставлено"


def get_city_coordinates(city_name: str) -> Optional[Dict[str, Any]]:
    """Get coordinates for a selected city"""
    coordinates = CITY_COORDINATES.get(city_name)
    if coordinates:
        latitude, longitude = coordinates
        return {
            "latitude": latitude,
            "longitude": longitude,
            "address": f"{city_name}, Кыргызстан",
            "source": "city_selection"
        }
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
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"reports/report_{timestamp}_{report_data.get('user_id', 'unknown')}.json"
    
    try:
        # Create reports directory if it doesn't exist
        import os
        os.makedirs('reports', exist_ok=True)
        
        async with aiofiles.open(filename, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(report_data, ensure_ascii=False, indent=2))
        
        return filename
    except Exception as e:
        print(f"Error saving report: {e}")
        return ""


def validate_report_data(report_data: Dict[str, Any]) -> tuple[bool, str]:
    """Validate report data completeness"""
    required_fields = ['type', 'region', 'city', 'report_text', 'user_name']
    
    for field in required_fields:
        if not report_data.get(field):
            return False, f"Поле '{field}' не заполнено"
    
    if len(report_data.get('report_text', '')) < 10:
        return False, "Содержание обращения слишком короткое (минимум 10 символов)"
    
    if len(report_data.get('user_name', '')) < 2:
        return False, "Контактные данные слишком короткие (минимум 2 символа)"
    
    return True, "Данные корректны"


def escape_markdown(text: str) -> str:
    """Escape markdown special characters"""
    special_chars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
    for char in special_chars:
        text = text.replace(char, f'\\{char}')
    return text 
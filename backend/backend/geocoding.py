import os
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
import googlemaps
from typing import Optional, Dict, Any

# Инициализация клиента Google Maps
gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY", ""))

# Словарь с предустановленными координатами городов Кыргызстана
CITY_COORDINATES = {
    "Бишкек": (42.8746, 74.5698),
    "Ош": (40.5283, 72.7985),
    # ... остальные координаты можно добавить при необходимости
}


@api_view(["GET"])
def geocode_location(request):
    """
    Эндпоинт для геокодинга адреса
    Принимает параметры:
    - city: название города (обязательный)
    - street: название улицы (опциональный)
    - house: номер дома (опциональный)
    """
    print("Request data:", request.data)
    print("Request GET params:", request.GET)
    print("Request headers:", request.headers)
    print("Request method:", request.method)
    print("Request user:", request.user)
    print("Request auth:", request.auth)
    city_name = request.GET.get("city")
    street = request.GET.get("street", "")
    house = request.GET.get("house", "")

    if not city_name:
        return Response({"error": "City name is required"}, status=400)

    try:
        # Формируем полный адрес для поиска
        address_parts = []
        if house:
            address_parts.append(house)
        if street:
            address_parts.append(street)
        address_parts.append(city_name)
        address_parts.append("Кыргызстан")

        search_query = ", ".join(address_parts)

        # Сначала пробуем получить координаты через Google Maps
        result = gmaps.geocode(search_query)

        if result:
            location = result[0]["geometry"]["location"]
            return Response(
                {
                    "latitude": location["lat"],
                    "longitude": location["lng"],
                    "address": result[0]["formatted_address"],
                    "source": "google_maps",
                    "full_query": search_query,
                }
            )

        # Если Google Maps не нашел результат, используем предустановленные координаты города
        coordinates = CITY_COORDINATES.get(city_name)
        if coordinates:
            latitude, longitude = coordinates
            return Response(
                {
                    "latitude": latitude,
                    "longitude": longitude,
                    "address": f"{search_query}",
                    "source": "fallback_coordinates",
                    "full_query": search_query,
                    "warning": "Точные координаты не найдены, использованы координаты центра города",
                }
            )

        return Response({"error": "Location not found"}, status=404)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

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
    """
    city_name = request.GET.get("city")
    if not city_name:
        return Response({"error": "City name is required"}, status=400)

    try:
        # Сначала пробуем получить координаты через Google Maps
        search_query = f"{city_name}, Кыргызстан"
        result = gmaps.geocode(search_query)

        if result:
            location = result[0]["geometry"]["location"]
            return Response(
                {
                    "latitude": location["lat"],
                    "longitude": location["lng"],
                    "address": result[0]["formatted_address"],
                    "source": "google_maps",
                }
            )

        # Если Google Maps не нашел результат, используем предустановленные координаты
        coordinates = CITY_COORDINATES.get(city_name)
        if coordinates:
            latitude, longitude = coordinates
            return Response(
                {
                    "latitude": latitude,
                    "longitude": longitude,
                    "address": f"{city_name}, Кыргызстан",
                    "source": "fallback_coordinates",
                }
            )

        return Response({"error": "Location not found"}, status=404)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

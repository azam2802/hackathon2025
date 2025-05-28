import json
import os
import base64
from openai import OpenAI
from firebase_admin import firestore, storage
from dotenv import load_dotenv
import requests
from io import BytesIO
from datetime import datetime
from typing import Optional, Dict, Any
import googlemaps
from django.conf import settings


load_dotenv()

# Инициализация клиента Google Maps
gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY", ""))

# Словарь с координатами городов (можно перенести в отдельный файл конфигурации)
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


def get_city_coordinates(city_name: str) -> Optional[Dict[str, Any]]:
    """
    Получение координат города через Google Maps API с резервным вариантом
    """
    try:
        # Поиск через Google Maps
        search_query = f"{city_name}, Кыргызстан"
        result = gmaps.geocode(search_query)

        if result:
            location = result[0]["geometry"]["location"]
            address_components = result[0]["address_components"]

            # Извлекаем компоненты адреса
            region = None
            city = None
            street = None
            house_number = None

            for component in address_components:
                if "administrative_area_level_1" in component["types"]:
                    region = component["long_name"]
                elif "locality" in component["types"]:
                    city = component["long_name"]
                elif "route" in component["types"]:
                    street = component["long_name"]
                elif "street_number" in component["types"]:
                    house_number = component["long_name"]

            # Формируем полный адрес
            full_address = result[0]["formatted_address"]

            return {
                "latitude": location["lat"],
                "longitude": location["lng"],
                "address": full_address,
                "region": region or "Не определен",
                "city": city or "Не определен",
                "street": street,
                "house_number": house_number,
                "source": "google_maps",
            }
    except Exception as e:
        print(f"Ошибка при получении координат из Google Maps: {e}")

    # Резервный вариант - предопределенные координаты
    coordinates = CITY_COORDINATES.get(city_name)
    if coordinates:
        latitude, longitude = coordinates
        return {
            "latitude": latitude,
            "longitude": longitude,
            "address": f"{city_name}, Кыргызстан",
            "region": "Не определен",
            "city": city_name,
            "street": None,
            "house_number": None,
            "source": "fallback_coordinates",
        }
    return None


def get_openai_client():
    """Initialize and return OpenAI client with proper error handling."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY environment variable is not set. "
            "Please set it in your environment or .env file."
        )
    return OpenAI(api_key=api_key)


def load_agency_data():
    """Load agency data from JSON file."""
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    with open(os.path.join(current_dir, "agency.json"), "r", encoding="utf-8") as f:
        return json.load(f)


def analyze_report_text(report_text):
    """Analyze report text using OpenAI to determine the service and agency."""
    agency_data = load_agency_data()

    # Create a prompt for OpenAI
    services_list = "\n".join(
        [f"- {item['service']} ({item['agency']})" for item in agency_data]
    )
    prompt = f"""Given the following report text, determine which government service it relates to from the list below.
    You must return a valid JSON object with exactly these fields: service and agency.
    The service must match exactly one of the services from the list below.
    The agency must match the corresponding agency for that service.

    Report text: {report_text}

    Available services:
    {services_list}

    Return ONLY a JSON object in this exact format:
    {{"service": "exact service name from list", "agency": "corresponding agency name", "importance": "low, medium, high"}}
    
    if you deem the report text does not belong to any of the services, or does not contain any relevant information, return:
    {{"service": "Spam", "agency": "Spam", "importance": "low"}}
    """

    try:
        # Get response from OpenAI
        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that categorizes citizen reports into government services. You must return only valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )

        # Get the response content
        response_content = response.choices[0].message.content.strip()
        print(f"OpenAI Response: {response_content}")

        # Parse the response
        try:
            result = json.loads(response_content)
            if (
                not isinstance(result, dict)
                or "service" not in result
                or "agency" not in result
            ):
                print("Invalid response format - missing required fields")
                return {"service": "Spam", "agency": "Spam", "importance": "low"}

            # Verify the service exists in our list
            service_exists = any(
                item["service"] == result["service"]
                and item["agency"] == result["agency"]
                for item in agency_data
            )

            if not service_exists:
                print(f"Service/Agency pair not found in our list: {result}")
                return {"service": "Spam", "agency": "Spam", "importance": "low"}

            return result
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {str(e)}")
            return {"service": "Spam", "agency": "Spam", "importance": "low"}
    except ValueError as e:
        print(f"OpenAI client error: {str(e)}")
        return {"service": "Spam", "agency": "Spam", "importance": "low"}
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {"service": "Spam", "agency": "Spam", "importance": "low"}


def save_to_firebase(report_data):
    """Save the report data to Firebase Firestore."""
    if not settings.FIREBASE_ENABLED:
        print("Firebase is disabled. Skipping save operation.")
        return True

    try:
        # Get Firestore client
        db = firestore.client()

        # Set the document ID to the value of 'rpt'
        document_id = report_data["rpt"]

        # Add the report to the 'reports' collection with the specified document ID
        db.collection("reports").document(document_id).set(report_data)

        return True
    except Exception as e:
        print(f"Error saving to Firebase: {str(e)}")
        return False


def process_report(report_data):
    """Process a report: analyze it and save to Firebase."""
    # Handle photo upload if present
    if (
        "photo_data" in report_data
        and report_data["photo_data"]
        and settings.FIREBASE_ENABLED
    ):
        try:
            print("Starting photo upload process...")
            # Decode base64 photo data
            photo_data = report_data["photo_data"]
            if isinstance(photo_data, str):
                try:
                    # Try to decode base64 string
                    photo_bytes = base64.b64decode(photo_data)
                    print("Successfully decoded base64 photo data")
                except Exception as decode_error:
                    print(f"Base64 decode error: {str(decode_error)}")
                    # If not base64, use as is
                    photo_bytes = photo_data.encode("utf-8")
                    print("Using raw string as photo data")
            else:
                photo_bytes = photo_data
                print("Using raw bytes as photo data")

            # Upload photo data to GCP
            bucket = storage.bucket("public-pulse")
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            date_path = datetime.now().strftime("%Y%m%d")
            blob_path = f"reports/{date_path}/{timestamp}.jpg"
            print(f"Uploading to blob path: {blob_path}")
            blob = bucket.blob(blob_path)

            # Upload from bytes
            blob.upload_from_string(photo_bytes, content_type="image/jpeg")
            print("Successfully uploaded photo to GCP")

            # Generate the public URL using the correct format
            public_url = f"https://storage.googleapis.com/public-pulse/{blob_path}"
            print(f"Generated public URL: {public_url}")
            report_data["photo_url"] = public_url
            del report_data["photo_data"]
            print(f"Photo URL set in report_data: {report_data['photo_url']}")
        except Exception as e:
            print(f"Error uploading photo to GCP: {str(e)}")
            print(f"Error type: {type(e)}")
            report_data["photo_url"] = None
            if "photo_data" in report_data:
                del report_data["photo_data"]
    else:
        if "photo_data" in report_data:
            del report_data["photo_data"]
        report_data["photo_url"] = None

    # Analyze the report text
    analysis_result = analyze_report_text(report_data["report_text"])

    # Add the analysis results to the report data
    report_data["service"] = analysis_result["service"]
    report_data["agency"] = analysis_result["agency"]
    report_data["importance"] = analysis_result["importance"]

    # Save to Firebase
    print(f"Final report_data before saving to Firebase: {report_data}")
    success = save_to_firebase(report_data)
    print(f"Save to Firebase result: {success}")

    return {"success": success, "data": report_data}

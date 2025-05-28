import json
import os
import base64
from openai import OpenAI
from firebase_admin import firestore, storage
from dotenv import load_dotenv
import requests
from io import BytesIO
from datetime import datetime


load_dotenv()


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
    try:
        # Get Firestore client
        db = firestore.client()

        # Use the provided ID if available, otherwise generate a unique one
        document_id = (
            report_data.get("id")
            or f"report_{datetime.now().strftime('%Y%m%d_%H%m%S')}"
        )

        # Add the report to the 'reports' collection with the specified document ID
        db.collection("reports").document(document_id).set(report_data)

        return True
    except Exception as e:
        print(f"Error saving to Firebase: {str(e)}")
        return False


def process_report(report_data):
    """Process a report: analyze it and save to Firebase."""
    # Handle photo upload if present
    if "photo_data" in report_data and report_data["photo_data"]:
        try:
            print("Starting photo upload process...")
            # Get photo data
            photo_data_url = report_data["photo_data"]

            # Extract base64 string from data URL (e.g., remove 'data:image/jpeg;base64,')
            if ";base64," in photo_data_url:
                header, base64_string = photo_data_url.split(",", 1)
                # Attempt to decode base64 string
                try:
                    photo_bytes = base64.b64decode(base64_string)
                    print("Successfully decoded base64 photo data")

                    # Determine content type from header if possible, otherwise default
                    content_type = "image/jpeg"  # Default
                    if header.startswith("data:") and ";" in header:
                        content_type_part = header[5 : header.index(";")]
                        if "/" in content_type_part:
                            content_type = content_type_part
                    print(f"Determined content type: {content_type}")

                except Exception as decode_error:
                    print(f"Base64 decode error: {str(decode_error)}")
                    raise ValueError(
                        "Invalid base64 data"
                    )  # Raise error for invalid data
            else:
                # If not a data URL with base64, assume it's not a valid photo data to upload
                print("Photo data is not a valid base64 data URL. Skipping upload.")
                photo_bytes = None  # Do not upload if data is not in expected format
                content_type = None

            if photo_bytes:
                # Upload photo data to GCP
                bucket = storage.bucket("public-pulse")
                timestamp = datetime.now().strftime(
                    "%Y%m%d_%H%m%S"
                )  # Fixed time format
                date_path = datetime.now().strftime("%Y%m%d")
                blob_path = f"reports/{date_path}/{timestamp}.jpg"  # Keep as jpg for consistency, consider parsing extension from content_type if needed
                print(f"Uploading to blob path: {blob_path}")
                blob = bucket.blob(blob_path)

                # Upload from bytes
                blob.upload_from_string(
                    photo_bytes, content_type=content_type or "image/jpeg"
                )  # Use determined content type or default
                print("Successfully uploaded photo to GCP")

                # Generate the public URL
                # Construct the URL correctly
                # Note: Public access to bucket or blob must be configured in GCP
                public_url = f"https://storage.googleapis.com/{bucket.name}/{blob_path}"
                print(f"Generated public URL: {public_url}")
                report_data["photo_url"] = public_url
                # Keep photo_data in report_data for now, can remove later if not needed downstream
                # del report_data["photo_data"]
                print(
                    f"Photo URL set in report_data: {report_data.get('photo_url')}"
                )  # Use .get for safety
            else:
                # If photo data was not suitable for upload, ensure no photo_url is set
                report_data["photo_url"] = None
                # Also remove photo_data if it was present but invalid format
                if "photo_data" in report_data:
                    del report_data["photo_data"]

        except Exception as e:
            print(f"Error uploading photo to GCP: {str(e)}")
            print(f"Error type: {type(e)}")
            report_data["photo_url"] = None
            if "photo_data" in report_data:
                del report_data["photo_data"]

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

import os
import firebase_admin
from firebase_admin import credentials, firestore, storage
from dotenv import load_dotenv

load_dotenv()


def initialize_firebase():
    """Initialize Firebase Admin SDK with proper error handling."""
    try:
        service_account_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "publicpulse-2025-adf4c6e9d3e0.json",
        )

        if not os.path.exists(service_account_path):
            print(
                "Warning: Firebase configuration file not found. Firebase features will be disabled."
            )
            return False

        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred, {"storageBucket": "public-pulse"})
        print("Firebase Admin SDK initialized successfully")
        return True
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK: {e}")
        return False

import firebase_admin
from firebase_admin import credentials
import os

def initialize_firebase():
    """Initialize Firebase Admin SDK with service account credentials."""
    try:
        # Get the absolute path to the service account file
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        service_account_path = os.path.join(current_dir, 'publicpulse-2025-adf4c6e9d3e0.json')
        
        # Initialize Firebase Admin SDK
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized successfully!")
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK: {str(e)}")
        raise 
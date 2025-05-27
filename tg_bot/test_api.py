#!/usr/bin/env python3
"""
Test script for Django backend API integration
"""

import asyncio
import json
from api_client import check_backend_health, send_report_to_api
from datetime import datetime

async def test_backend_connection():
    """Test connection to Django backend"""
    print("=== Testing Django Backend Connection ===")
    
    # Test health check
    print("1. Testing backend health...")
    health_result = await check_backend_health()
    print(f"Health check result: {health_result}")
    
    if not health_result.get('success'):
        print("❌ Backend is not reachable. Make sure Django server is running.")
        return
    
    print("✅ Backend is healthy!")
    
    # Test report submission
    print("\n2. Testing report submission...")
    test_report_data = {
        'type': 'Жалоба',
        'region': 'Бишкек',
        'city': 'Бишкек',
        'report_text': 'Тестовое обращение для проверки работы системы. Не могу получить загранпаспорт, очень долгие очереди.',
        'user_name': 'Тестовый Пользователь',
        'user_id': 123456789,
        'username': 'test_user',
        'location': {
            'latitude': 42.8746,
            'longitude': 74.5698,
            'address': 'Бишкек, Кыргызстан',
            'source': 'city_selection'
        },
        'created_at': datetime.now().strftime('%d.%m.%Y %H:%M'),
        'language': 'ru'
    }
    
    submission_result = await send_report_to_api(test_report_data)
    print(f"Submission result: {json.dumps(submission_result, indent=2, ensure_ascii=False)}")
    
    if submission_result.get('success'):
        print("✅ Report submitted successfully!")
        service = submission_result.get('data', {}).get('service')
        agency = submission_result.get('data', {}).get('agency')
        print(f"🔍 Classified as: {service}")
        print(f"🏛️ Assigned to: {agency}")
    else:
        print("❌ Report submission failed!")

if __name__ == "__main__":
    asyncio.run(test_backend_connection()) 
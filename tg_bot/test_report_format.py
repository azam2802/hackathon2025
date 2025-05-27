#!/usr/bin/env python3
"""
Test script to verify report formatting without user ID and location fields
"""

import asyncio
from utils import format_report
from datetime import datetime

async def test_report_formatting():
    """Test that report formatting excludes user ID and location fields"""
    
    # Sample report data
    test_report_data = {
        'type': 'Жалоба',
        'region': 'Бишкек',
        'city': 'Бишкек',
        'report_text': 'Тестовое обращение для проверки форматирования отчета.',
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
    
    print("=== Testing Report Formatting ===")
    
    # Test Russian formatting
    print("\n1. Russian format:")
    ru_report = await format_report(test_report_data, 'ru')
    print(ru_report)
    
    # Test Kyrgyz formatting
    print("\n2. Kyrgyz format:")
    ky_report = await format_report(test_report_data, 'ky')
    print(ky_report)
    
    # Check that user ID and location are NOT in the formatted reports
    print("\n=== Verification ===")
    
    # Check for user ID field
    if 'ID пользователя' in ru_report or 'Колдонуuчунун ID' in ky_report:
        print("❌ FAIL: User ID field found in report")
    else:
        print("✅ PASS: User ID field not found in report")
    
    # Check for location field
    if 'Местоположение' in ru_report or 'Жайгашкан жери' in ky_report:
        print("❌ FAIL: Location field found in report")
    else:
        print("✅ PASS: Location field not found in report")
    
    # Check that essential fields are still present
    essential_checks = [
        ('Тип обращения' in ru_report, 'Report type in Russian'),
        ('Кайрылуuнун түрү' in ky_report, 'Report type in Kyrgyz'),
        ('Регион' in ru_report, 'Region in Russian'),
        ('Аймаk' in ky_report, 'Region in Kyrgyz'),
        ('Контактные данные' in ru_report, 'Contact info in Russian'),
        ('Байланыш маалыматтары' in ky_report, 'Contact info in Kyrgyz'),
        ('Содержание обращения' in ru_report, 'Content in Russian'),
        ('Кайрылуuнун мазмуну' in ky_report, 'Content in Kyrgyz')
    ]
    
    for check, description in essential_checks:
        if check:
            print(f"✅ PASS: {description}")
        else:
            print(f"❌ FAIL: {description}")

if __name__ == "__main__":
    asyncio.run(test_report_formatting()) 
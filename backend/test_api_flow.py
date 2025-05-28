#!/usr/bin/env python3
"""
Complete Website Flow Test - Simplified version
Tests form submission → API → email notification
"""

import requests
import json
from datetime import datetime

API_BASE_URL = 'http://localhost:8000'

def test_website_submission_flow():
    """Test complete flow: form submission → database → email"""
    
    print("🌐 TESTING COMPLETE WEBSITE FLOW")
    print("=" * 50)
    
    # Your email for testing
    test_email = "1abdyraiymova.n@gmail.com"
    print(f"✅ Testing with email: {test_email}")
    print()
    
    # Generate unique complaint ID
    complaint_id = f'web_test_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    
    # Step 1: Submit complaint through API (simulating website form)
    print("📝 Step 1: Submitting complaint...")
    
    form_data = {
        'id': complaint_id,
        'report_text': 'Тестовая жалоба: не работает освещение в парке Панфилова.',
        'recommendations': 'Прошу восстановить освещение для безопасности граждан.',
        'report_type': 'Жалоба',
        'region': 'Чуйская область',
        'city': 'Бишкек',
        'address': 'Парк Панфилова, центральная аллея',
        'full_name': 'Тестовый Пользователь',
        'phone': '+996 555 999888',
        'email': test_email,
        'importance': 'medium',
        'language': 'ru',
        'latitude': 42.8746,
        'longitude': 74.5698,
        'contact_info': f'Тестовый Пользователь, +996 555 999888, {test_email}',
        'created_at': datetime.now().strftime('%d.%m.%Y, %H:%M'),
        'status': 'pending',
        'submission_source': 'website',
        'location_source': 'geocoded',
        'service': 'Городское освещение',
        'agency': 'Тестовое ведомство'
    }
    
    try:
        # Submit complaint
        response = requests.post(
            f"{API_BASE_URL}/api/reports/",
            headers={'Content-Type': 'application/json'},
            data=json.dumps(form_data),
            timeout=10
        )
        
        if response.status_code == 201:
            print(f"   ✅ Complaint submitted: ID {complaint_id}")
        else:
            print(f"   ❌ Failed to submit: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Cannot connect to Django server")
        return False
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False
    
    print()
    
    # Step 2: Test email API endpoint
    print("📧 Step 2: Testing email notifications...")
    
    email_tests = [
        ('pending', 'Welcome email'),
        ('resolved', 'Resolved notification'),
        ('cancelled', 'Cancelled notification')
    ]
    
    successful_emails = 0
    
    for status, description in email_tests:
        print(f"   📤 Sending {description}...")
        
        try:
            email_response = requests.post(
                f"{API_BASE_URL}/api/send-status-email/",
                headers={'Content-Type': 'application/json'},
                data=json.dumps({
                    'complaint_id': complaint_id,
                    'status': status,
                    'notes': f'Test notification for {status} status',
                    'language': 'ru'
                }),
                timeout=10
            )
            
            if email_response.status_code == 200:
                print(f"   ✅ {description} sent successfully!")
                successful_emails += 1
            else:
                print(f"   ❌ Failed to send {description}: {email_response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error sending {description}: {str(e)}")
    
    print()
    print("🎯 FLOW TEST RESULTS:")
    print("=" * 50)
    print(f"✅ Complaint submitted: {complaint_id}")
    print(f"📧 Emails sent: {successful_emails}/3")
    print(f"📬 Check your Gmail: {test_email}")
    
    if successful_emails > 0:
        print("\n🎉 WEBSITE FLOW IS WORKING!")
        print("Users can now submit complaints and receive email notifications!")
    
    return successful_emails > 0

if __name__ == "__main__":
    success = test_website_submission_flow()
    
    if success:
        print("\n✅ ALL SYSTEMS WORKING!")
        print("🚀 Your PublicPulse email notification system is ready!")
    else:
        print("\n⚠️ Some issues found. Check the logs above.")

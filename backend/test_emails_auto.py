#!/usr/bin/env python3
"""
Real Email Testing Script - Non-interactive version
Tests email notifications with actual website form data
"""

import sys
import os
import django
from datetime import datetime

# Add the backend directory to Python path
sys.path.append('/Users/nasipaabdyraiymova/Documents/GitHub/hackathon2025/backend')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from analyze.email_service import send_status_update_email

def test_complaint_emails():
    """Test email with realistic website form submission data"""
    
    print("📧 TESTING COMPLAINT EMAIL NOTIFICATIONS")
    print("=" * 60)
    
    # Use your email for testing
    test_email = "1abdyraiymova.n@gmail.com"
    print(f"✅ Testing with email: {test_email}")
    print()
    
    # Simulate realistic complaint data from website form
    website_complaint_data = {
        'id': f'test_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
        'report_text': 'На улице Жибек Жолу не работает уличное освещение уже более недели. Это создает опасность для пешеходов и водителей в темное время суток. Прошу принять меры по восстановлению освещения.',
        'recommendations': 'Рекомендую проверить электрические сети и заменить неисправные лампы. Также следует установить более надежную систему освещения.',
        'report_type': 'Жалоба',
        'region': 'Чуйская область',
        'city': 'Бишкек',
        'address': 'ул. Жибек Жолу, 45',
        'full_name': 'Айгуль Токтосунова',
        'phone': '+996 555 123456',
        'email': test_email,
        'importance': 'high',
        'language': 'ru',
        'latitude': 42.8746,
        'longitude': 74.5698,
        'contact_info': f'Айгуль Токтосунова, +996 555 123456, {test_email}',
        'created_at': datetime.now().strftime('%d.%m.%Y, %H:%M'),
        'status': 'pending',
        'submission_source': 'website',
        'location_source': 'geocoded',
        'service': 'Городское освещение',
        'agency': 'Бишкекглавархитектура',
        'notes': 'Жалоба принята к рассмотрению. Направлена в соответствующую службу.'
    }
    
    print("📝 Test Complaint Details:")
    print(f"   Имя: {website_complaint_data['full_name']}")
    print(f"   Email: {website_complaint_data['email']}")
    print(f"   Тема: {website_complaint_data['report_text'][:50]}...")
    print(f"   Адрес: {website_complaint_data['address']}")
    print(f"   Регион: {website_complaint_data['region']}")
    print()
    
    # Test different status email notifications
    statuses = [
        ('pending', 'Уведомление о получении жалобы'),
        ('resolved', 'Уведомление о решении проблемы'),
        ('cancelled', 'Уведомление об отклонении жалобы')
    ]
    
    successful_emails = 0
    
    for status, description in statuses:
        print(f"📤 Отправка: {description}")
        
        try:
            # Send the email
            success = send_status_update_email(
                complaint_data=website_complaint_data,
                new_status=status,
                language='ru'
            )
            
            if success:
                print(f"   ✅ {description} отправлено успешно!")
                successful_emails += 1
            else:
                print(f"   ❌ Ошибка отправки {description}")
                
        except Exception as e:
            print(f"   ❌ Ошибка: {str(e)}")
        
        print()
    
    print("🎯 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:")
    print("=" * 60)
    print(f"✅ Успешно отправлено: {successful_emails}/3 писем")
    print(f"📧 Email получатель: {test_email}")
    print()
    
    if successful_emails > 0:
        print("🎉 ПРОВЕРЬТЕ ВАШУ ПОЧТУ!")
        print("Вы должны получить письма с:")
        if successful_emails >= 1:
            print("1. 📥 Уведомление о получении жалобы (статус: в процессе)")
        if successful_emails >= 2:
            print("2. ✅ Уведомление о решении (статус: решено)")
        if successful_emails >= 3:
            print("3. ❌ Уведомление об отклонении (статус: отклонено)")
        
        print("\n💡 Если письма не приходят, проверьте папку 'Спам'")
    
    return successful_emails

def test_kyrgyz_language():
    """Test email in Kyrgyz language"""
    
    print("\n🇰🇬 TESTING KYRGYZ LANGUAGE EMAIL")
    print("=" * 60)
    
    test_email = "1abdyraiymova.n@gmail.com"
    
    kyrgyz_complaint_data = {
        'id': f'ky_test_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
        'report_text': 'Манас көчөсүндө көчө жарыгы иштебей жатат. Муну оңдоп берүүңүздү сураймын.',
        'report_type': 'Арыз',
        'region': 'Чүй облусу',
        'city': 'Бишкек',
        'address': 'Манас көчөсү, 15',
        'full_name': 'Гүлнара Исакова',
        'phone': '+996 777 654321',
        'email': test_email,
        'language': 'ky',
        'contact_info': f'Гүлнара Исакова, +996 777 654321, {test_email}',
        'created_at': datetime.now().strftime('%d.%m.%Y, %H:%M'),
        'status': 'pending',
        'submission_source': 'website'
    }
    
    print(f"📤 Отправка кыргызского уведомления на {test_email}")
    
    try:
        success = send_status_update_email(
            complaint_data=kyrgyz_complaint_data,
            new_status='pending',
            language='ky'
        )
        
        if success:
            print("✅ Кыргыз тилиндеги email жөнөтүлдү!")
            return True
        else:
            print("❌ Кыргыз тилиндеги email жөнөтүлгөн жок")
            return False
            
    except Exception as e:
        print(f"❌ Ката: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 PUBLICPULSE EMAIL NOTIFICATION TESTING")
    print("=" * 60)
    
    # Test Russian emails
    russian_success = test_complaint_emails()
    
    # Test Kyrgyz email
    kyrgyz_success = test_kyrgyz_language()
    
    print("\n" + "=" * 60)
    print("📊 FINAL SUMMARY")
    print("=" * 60)
    print(f"Russian emails sent: {russian_success}/3")
    print(f"Kyrgyz email sent: {'✅' if kyrgyz_success else '❌'}")
    print(f"Total emails sent: {russian_success + (1 if kyrgyz_success else 0)}/4")
    
    if russian_success > 0 or kyrgyz_success:
        print("\n🎉 SUCCESS! Email notifications are working!")
        print("📬 Check your Gmail inbox for the notification emails")
        print("🔍 Don't forget to check your Spam folder too")
    else:
        print("\n⚠️ No emails were sent successfully. Check your configuration.")

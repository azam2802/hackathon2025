#!/usr/bin/env python3
"""
Email Notification Test Script for Complaint ha6b51zrv
This script tests all email notification scenarios for the Django admin system.
"""

import os
import sys
import django

# Add the backend directory to Python path
backend_path = '/Users/nasipaabdyraiymova/Documents/GitHub/hackathon2025/backend'
sys.path.append(backend_path)
os.chdir(backend_path)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from analyze.models import Complaint
from analyze.email_service import send_status_update_email

def test_email_notifications():
    """Test email notifications for complaint ha6b51zrv"""
    
    # Find the complaint
    complaint = Complaint.objects.filter(firestore_id='ha6b51zrv').first()
    
    if not complaint:
        print("❌ Complaint ha6b51zrv not found!")
        return
    
    print(f"🔍 Testing email notifications for complaint: {complaint.firestore_id}")
    print(f"📧 Email: {complaint.email}")
    print(f"📝 Report type: {complaint.report_type}")
    print(f"🌐 Submission source: {complaint.submission_source}")
    print(f"📊 Current status: {complaint.status}")
    print("-" * 60)
    
    # Test 1: Manual email sending
    print("\n1️⃣ Testing manual email notification...")
    try:
        # Use the complaint's method to send email
        complaint.send_status_update_email()
        print("✅ Manual email sent successfully!")
    except Exception as e:
        print(f"❌ Manual email error: {e}")
    
    # Test 2: Automatic email through status change to 'pending'
    print("\n2️⃣ Testing automatic email: status change to 'pending'...")
    try:
        original_status = complaint.status
        complaint.status = 'pending'
        complaint.save()
        print("✅ Status changed to 'pending' - automatic email should be sent!")
    except Exception as e:
        print(f"❌ Status change error: {e}")
    
    # Test 3: Automatic email through status change to 'resolved'
    print("\n3️⃣ Testing automatic email: status change to 'resolved'...")
    try:
        complaint.status = 'resolved'
        complaint.save()
        print("✅ Status changed to 'resolved' - automatic email should be sent!")
    except Exception as e:
        print(f"❌ Status change error: {e}")
    
    # Test 4: Automatic email through status change to 'cancelled'
    print("\n4️⃣ Testing automatic email: status change to 'cancelled'...")
    try:
        complaint.status = 'cancelled'
        complaint.save()
        print("✅ Status changed to 'cancelled' - automatic email should be sent!")
    except Exception as e:
        print(f"❌ Status change error: {e}")
    
    # Test 5: Non-website complaint (should NOT send email)
    print("\n5️⃣ Testing non-website complaint (should NOT send email)...")
    try:
        # Temporarily change submission source
        original_source = complaint.submission_source
        complaint.submission_source = 'telegram'
        complaint.status = 'pending'
        complaint.save()
        print("✅ Status changed for telegram complaint - NO email should be sent!")
        
        # Restore original source
        complaint.submission_source = original_source
        complaint.save()
        print("✅ Submission source restored to 'website'")
    except Exception as e:
        print(f"❌ Non-website test error: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Email notification testing completed!")
    print(f"📧 All emails should be sent to: {complaint.email}")
    print("💡 Check the email inbox for notifications.")
    print("🔗 Admin interface: http://127.0.0.1:8002/admin/")
    print("👤 Login: admin / admin123")

if __name__ == "__main__":
    test_email_notifications()

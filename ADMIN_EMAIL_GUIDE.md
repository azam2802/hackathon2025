# 📧 How to Use Automatic Email System - Admin Guide

## 🎯 Your Email System is ALREADY WORKING!

The automatic email notification system is **fully operational** and sends emails automatically when you update complaint statuses.

## 🚀 How to Send Automatic Emails

### Method 1: Single Complaint Update
1. Go to: http://127.0.0.1:8002/admin/
2. Login: `admin` / `admin123`
3. Click "Complaints" under "ANALYZE"
4. Click on any complaint to edit it
5. Change the "Status" field to:
   - `pending` (в процессе)
   - `resolved` (решено) 
   - `cancelled` (отклонено)
6. Click "Save" 
7. ✅ **Email automatically sent!**

### Method 2: Bulk Email Updates
1. Go to the Complaints list in admin
2. Select multiple complaints (checkboxes)
3. Choose action from dropdown:
   - "Mark as pending"
   - "Mark as resolved" 
   - "Mark as cancelled"
   - "Send email notifications"
4. Click "Go"
5. ✅ **Emails automatically sent to all selected complaints!**

## 📧 Who Gets Emails?

✅ **WILL receive emails:**
- Complaints submitted through website (`submission_source: website`)
- Valid email addresses
- Status changes to: pending, resolved, cancelled

❌ **Will NOT receive emails:**
- Telegram submissions (`submission_source: telegram`)
- Missing email addresses
- Status changes to other values

## 🧪 Test Emails Already Sent

**Test Complaint**: `ha6b51zrv`
**Email**: `pushkinzolotenki@gmail.com`
**Tests Completed**: ✅ pending → resolved → cancelled

## 🔧 Email Content

Emails include:
- Professional government branding
- Status-specific messages in Russian/Kyrgyz
- Complaint reference number
- Contact information for follow-up

## 🎯 Available Complaints for Testing

Currently **10 website complaints** ready for email notifications:
- `ha6b51zrv` → pushkinzolotenki@gmail.com
- `report_20250528_190520` → superadmin@gov.kg
- `report_20250528_191529` → superadmin@gov.kg
- And 7 more...

## ⚡ Quick Test

Run this command to send test emails:
```bash
cd /Users/nasipaabdyraiymova/Documents/GitHub/hackathon2025
python demo_automatic_emails.py
```

## 🎉 READY TO USE!

Your automatic email system is **fully operational**. Just log into the admin interface and start updating complaint statuses - emails will be sent automatically!

**Admin URL**: http://127.0.0.1:8002/admin/
**Login**: admin / admin123

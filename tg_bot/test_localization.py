#!/usr/bin/env python3
"""
Test script for localization functionality
"""

from localization import get_text, get_region_name, get_report_type_name

def test_localization():
    """Test localization functions"""
    
    print("=== Testing Russian (ru) ===")
    print("Welcome:", get_text('welcome', 'ru'))
    print("Submit report:", get_text('submit_report', 'ru'))
    print("Region - Bishkek:", get_region_name('Бишкек', 'ru'))
    print("Report type - Complaint:", get_report_type_name('Жалоба', 'ru'))
    
    print("\n=== Testing Kyrgyz (ky) ===")
    print("Welcome:", get_text('welcome', 'ky'))
    print("Submit report:", get_text('submit_report', 'ky'))
    print("Region - Chuy Oblast:", get_region_name('Чуйская область', 'ky'))
    print("Report type - Complaint:", get_report_type_name('Жалоба', 'ky'))
    
    print("\n=== Testing with parameters ===")
    print("Russian report preview:", get_text('report_preview', 'ru', report="Test report content"))
    print("Kyrgyz report preview:", get_text('report_preview', 'ky', report="Test report content"))

if __name__ == "__main__":
    test_localization() 
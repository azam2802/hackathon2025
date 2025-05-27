#!/usr/bin/env python3
"""
Setup script for Government Services Telegram Bot
"""

import os
import sys


def create_env_file():
    """Create .env file from template"""
    if os.path.exists('.env'):
        print("✅ .env file already exists")
        return
    
    if not os.path.exists('env_example.txt'):
        print("❌ env_example.txt not found")
        return
    
    # Copy template
    with open('env_example.txt', 'r') as f:
        content = f.read()
    
    print("\n🔧 Setting up environment variables...")
    
    # Get bot token
    bot_token = input("Enter your Bot Token (from @BotFather): ").strip()
    if not bot_token:
        print("❌ Bot token is required!")
        return False
    
    # Get admin user ID
    admin_id = input("Enter Admin User ID (optional, press Enter to skip): ").strip()
    if not admin_id:
        admin_id = "0"
    
    # Replace placeholders
    content = content.replace("your_bot_token_here", bot_token)
    content = content.replace("your_admin_user_id_here", admin_id)
    
    # Write .env file
    with open('.env', 'w') as f:
        f.write(content)
    
    print("✅ .env file created successfully!")
    return True


def create_reports_directory():
    """Create reports directory"""
    if not os.path.exists('reports'):
        os.makedirs('reports')
        print("✅ Reports directory created")
    else:
        print("✅ Reports directory already exists")


def check_python_version():
    """Check Python version"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required!")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True


def install_dependencies():
    """Install Python dependencies"""
    print("\n📦 Installing dependencies...")
    os.system("pip install -r requirements.txt")
    print("✅ Dependencies installed!")


def main():
    """Main setup function"""
    print("🚀 Government Services Telegram Bot Setup")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        return
    
    # Install dependencies
    install_dependencies()
    
    # Create directories
    create_reports_directory()
    
    # Setup environment
    if not create_env_file():
        return
    
    print("\n" + "=" * 50)
    print("🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("1. Review your .env file")
    print("2. Run the bot: python main.py")
    print("3. Test the bot by sending /start")
    print("\n📚 Read README.md for more information")


if __name__ == "__main__":
    main() 
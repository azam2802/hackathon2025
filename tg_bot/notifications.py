import logging
from typing import Optional
from aiogram import Bot
from localization import get_text

async def send_status_update_notification(
    bot: Bot,
    user_id: int,
    report_id: str,
    content: str,
    status: str,
    notes: str,
    language: str = 'ru'
) -> bool:
    """
    Send a notification to a user about their report status update
    
    Args:
        bot: Telegram bot instance
        user_id: Telegram user ID to send notification to
        report_id: ID of the report
        status: New status of the report ('resolved' or 'cancelled')
        notes: Notes about the status update
        language: User's preferred language ('ru' or 'ky')
        
    Returns:
        bool: True if notification was sent successfully, False otherwise
    """
    try:
        # Get appropriate message based on status
        if status == 'resolved':
            message = get_text('report_resolved', language, report_id=report_id, notes=notes, content=content)
        elif status == 'cancelled':
            message = get_text('report_cancelled', language, report_id=report_id, notes=notes, content=content)
        else:
            logging.warning(f"Unknown status for notification: {status}")
            return False
            
        # Send message to user
        await bot.send_message(
            chat_id=user_id,
            text=message,
            parse_mode="Markdown"
        )
        
        logging.info(f"Status update notification sent to user {user_id} for report {report_id}")
        return True
        
    except Exception as e:
        logging.error(f"Failed to send status update notification: {e}")
        return False 
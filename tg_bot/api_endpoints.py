import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from notifications import send_status_update_notification
from instances import bot

router = APIRouter()

class StatusUpdateRequest(BaseModel):
    report_id: str
    content: str
    status: str
    notes: str
    telegram_user_id: int
    language: str = 'ru'

@router.post("/api/notify-status-update")
async def notify_status_update(request: StatusUpdateRequest) -> Dict[str, Any]:
    """
    API endpoint to send status update notifications to users
    
    Args:
        request: Status update request data
        
    Returns:
        Dict with success status and message
    """
    try:
        # Validate status
        if request.status not in ['resolved', 'cancelled']:
            raise HTTPException(
                status_code=400,
                detail="Invalid status. Must be 'resolved' or 'cancelled'"
            )
            
        # Send notification
        success = await send_status_update_notification(
            bot=bot,
            content=request.content,
            user_id=request.telegram_user_id,
            report_id=request.report_id,
            status=request.status,
            notes=request.notes,
            language=request.language
        )
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to send notification"
            )
            
        return {
            "success": True,
            "message": "Notification sent successfully"
        }
        
    except Exception as e:
        logging.error(f"Error in notify-status-update endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        ) 
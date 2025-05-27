import aiohttp
import json
import logging
from typing import Dict, Any, Optional
from config import BOT_TOKEN, API_BASE_URL, API_KEY


class APIClient:
    """Client for sending reports to backend API"""
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or API_BASE_URL
        self.session = None
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def send_report(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send report to backend API
        
        Args:
            report_data: Dictionary containing report information
            
        Returns:
            API response as dictionary
        """
        try:
            # Prepare payload for API
            payload = self._prepare_payload(report_data)
            
            # Headers for API request
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {API_KEY or BOT_TOKEN}',
                'User-Agent': 'GovServices-TelegramBot/1.0'
            }
            
            # Make API request
            async with self.session.post(
                f"{self.base_url}/api/reports",
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    logging.info(f"Report sent successfully: {result.get('id', 'unknown')}")
                    return {
                        'success': True,
                        'data': result,
                        'message': 'Report sent successfully'
                    }
                else:
                    error_text = await response.text()
                    logging.error(f"API error {response.status}: {error_text}")
                    return {
                        'success': False,
                        'error': f"API error: {response.status}",
                        'message': 'Failed to send report to server'
                    }
                    
        except aiohttp.ClientTimeout:
            logging.error("API request timeout")
            return {
                'success': False,
                'error': 'timeout',
                'message': 'Request timeout - please try again'
            }
            
        except aiohttp.ClientError as e:
            logging.error(f"API client error: {e}")
            return {
                'success': False,
                'error': 'client_error',
                'message': 'Network error - please check connection'
            }
            
        except Exception as e:
            logging.error(f"Unexpected error sending report: {e}")
            return {
                'success': False,
                'error': 'unknown',
                'message': 'Unexpected error occurred'
            }
    
    def _prepare_payload(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare report data for API submission
        
        Args:
            report_data: Raw report data from bot
            
        Returns:
            Formatted payload for API
        """
        location = report_data.get('location', {})
        
        payload = {
            'report_type': report_data.get('type'),
            'region': report_data.get('region'),
            'city': report_data.get('city'),
            'content': report_data.get('report_text'),
            'contact_info': report_data.get('user_name'),
            'telegram_user_id': report_data.get('user_id'),
            'telegram_username': report_data.get('username'),
            'location': {
                'latitude': location.get('latitude'),
                'longitude': location.get('longitude'),
                'address': location.get('address'),
                'source': location.get('source', 'city_selection')
            },
            'created_at': report_data.get('created_at'),
            'source': 'telegram_bot',
            'version': '1.0'
        }
        
        return payload
    
    async def get_report_status(self, report_id: str) -> Dict[str, Any]:
        """
        Get status of submitted report
        
        Args:
            report_id: ID of the report to check
            
        Returns:
            Report status information
        """
        try:
            headers = {
                'Authorization': f'Bearer {API_KEY or BOT_TOKEN}',
                'User-Agent': 'GovServices-TelegramBot/1.0'
            }
            
            async with self.session.get(
                f"{self.base_url}/api/reports/{report_id}",
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=15)
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    return {
                        'success': True,
                        'data': result
                    }
                else:
                    return {
                        'success': False,
                        'error': f"Status check failed: {response.status}"
                    }
                    
        except Exception as e:
            logging.error(f"Error checking report status: {e}")
            return {
                'success': False,
                'error': 'status_check_failed'
            }


# Global API client instance
api_client = APIClient()


async def send_report_to_api(report_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convenience function to send report to API
    
    Args:
        report_data: Report data dictionary
        
    Returns:
        API response
    """
    async with APIClient() as client:
        return await client.send_report(report_data)


async def check_report_status(report_id: str) -> Dict[str, Any]:
    """
    Convenience function to check report status
    
    Args:
        report_id: Report ID to check
        
    Returns:
        Status information
    """
    async with APIClient() as client:
        return await client.get_report_status(report_id) 
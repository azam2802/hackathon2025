import aiohttp
import json
import logging
import hashlib
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
            
            # Headers for Django API request
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'GovServices-TelegramBot/1.0',
                'Accept': 'application/json'
            }
            
            # Add authorization header if API key is provided
            if API_KEY:
                headers['Authorization'] = f'Bearer {API_KEY}'
            
            # Make API request
            async with self.session.post(
                f"{self.base_url}/api/reports/",  # Django expects trailing slash
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                
                if response.status == 201:  # Django returns 201 for created
                    result = await response.json()
                    # Generate a unique ID for tracking
                    report_id = f"RPT-{payload['rpt']}"
                    logging.info(f"Report sent successfully to Django backend")
                    return {
                        'success': True,
                        'data': {
                            'id': report_id,
                            'service': result.get('service', 'Unknown'),
                            'agency': result.get('agency', 'Unknown'),
                            'status': 'registered',
                            'analysis_completed': True
                        },
                        'message': 'Report sent successfully and analyzed'
                    }
                elif response.status == 200:  # Fallback for 200 OK
                    result = await response.json()
                    report_id = f"RPT-{payload['rpt']}"
                    logging.info(f"Report sent successfully to Django backend")
                    return {
                        'success': True,
                        'data': {
                            'id': report_id,
                            'service': result.get('service', 'Unknown'),
                            'agency': result.get('agency', 'Unknown'),
                            'status': 'registered',
                            'analysis_completed': True
                        },
                        'message': 'Report sent successfully and analyzed'
                    }
                else:
                    error_text = await response.text()
                    logging.error(f"Django API error {response.status}: {error_text}")
                    return {
                        'success': False,
                        'error': f"Django API error: {response.status}",
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
    
    def _generate_rpt_hash(self, user_id: str, timestamp: str) -> str:
        """
        Generate a unique RPT hash using user ID and timestamp
        
        Args:
            user_id: Telegram user ID
            timestamp: Report creation timestamp
            
        Returns:
            Unique RPT hash string
        """
        # Combine user ID and timestamp
        data = f"{user_id}:{timestamp}"
        # Generate SHA-256 hash
        hash_obj = hashlib.sha256(data.encode())
        # Take first 10 characters of hex digest
        return f"{hash_obj.hexdigest()[:16]}"

    def _prepare_payload(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare report data for Django backend API submission
        
        Args:
            report_data: Raw report data from bot
            
        Returns:
            Formatted payload for Django API
        """
        location = report_data.get('location', {})
        created_at = report_data.get('created_at')
        user_id = report_data.get('user_id')
        
        # Generate RPT hash
        rpt_hash = self._generate_rpt_hash(str(user_id), str(created_at))
        
        # Format payload according to Django backend expectations
        payload = {
            'rpt': rpt_hash,  # Add RPT hash to payload
            'status': 'pending',
            'report_type': report_data.get('type'),
            'region': report_data.get('region'),
            'city': report_data.get('city'),
            'report_text': report_data.get('report_text'),  # Backend expects 'report_text'
            'contact_info': report_data.get('user_name'),
            'telegram_user_id': report_data.get('user_id'),
            'telegram_username': report_data.get('username', 'unknown'),
            'latitude': location.get('latitude'),
            'longitude': location.get('longitude'),
            'address': location.get('address', ''),
            'location_source': location.get('source', 'city_selection'),
            'created_at': created_at,
            'submission_source': 'telegram_bot',
            'language': report_data.get('language', 'ru')
        }
        
        return payload
    
    async def check_backend_health(self) -> Dict[str, Any]:
        """
        Check if Django backend is running and accessible
        
        Returns:
            Health check result
        """
        try:
            headers = {
                'User-Agent': 'GovServices-TelegramBot/1.0',
                'Accept': 'application/json'
            }
            
            async with self.session.get(
                f"{self.base_url}/api/hello/",
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    logging.info("Django backend health check successful")
                    return {
                        'success': True,
                        'data': result,
                        'message': 'Backend is healthy'
                    }
                else:
                    return {
                        'success': False,
                        'error': f"Health check failed: {response.status}",
                        'message': 'Backend is not responding correctly'
                    }
                    
        except Exception as e:
            logging.error(f"Backend health check failed: {e}")
            return {
                'success': False,
                'error': 'backend_unreachable',
                'message': 'Cannot reach backend server'
            }

    async def get_report_status(self, report_id: str) -> Dict[str, Any]:
        """
        Get status of submitted report (not implemented in Django backend yet)
        
        Args:
            report_id: ID of the report to check
            
        Returns:
            Report status information
        """
        try:
            headers = {
                'User-Agent': 'GovServices-TelegramBot/1.0',
                'Accept': 'application/json'
            }
            
            if API_KEY:
                headers['Authorization'] = f'Bearer {API_KEY}'
            
            # Note: This endpoint doesn't exist in the Django backend yet
            async with self.session.get(
                f"{self.base_url}/api/reports/{report_id}/",
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


async def check_backend_health() -> Dict[str, Any]:
    """
    Convenience function to check Django backend health
    
    Returns:
        Health check result
    """
    async with APIClient() as client:
        return await client.check_backend_health() 
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Complaint
from .email_service import send_status_update_email
import logging
import json

logger = logging.getLogger(__name__)


class FirestoreWebhookView(APIView):
    """
    Webhook endpoint to receive Firestore document updates
    This can be called by Firestore triggers or the frontend when documents are updated
    """
    
    def post(self, request):
        """Handle Firestore document update webhook"""
        try:
            data = request.data
            document_id = data.get('document_id')
            action = data.get('action', 'update')  # create, update, delete
            document_data = data.get('data', {})
            old_data = data.get('old_data', {})
            
            if not document_id:
                return Response(
                    {"error": "document_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"Received Firestore webhook for document {document_id}, action: {action}")
            
            if action in ['create', 'update']:
                # Sync or create the complaint in Django
                complaint = Complaint.sync_from_firestore(document_id)
                
                if complaint and action == 'update':
                    # Check if status changed
                    old_status = old_data.get('status')
                    new_status = document_data.get('status', complaint.status)
                    
                    if (old_status and old_status != new_status and 
                        complaint.submission_source == 'website' and
                        new_status in ['pending', 'resolved', 'cancelled']):
                        
                        logger.info(f"Status changed for complaint {document_id}: {old_status} -> {new_status}")
                        
                        # Send email notification
                        try:
                            complaint.send_status_update_email()
                            logger.info(f"Email notification sent for complaint {document_id}")
                        except Exception as e:
                            logger.error(f"Failed to send email for complaint {document_id}: {e}")
                
                return Response(
                    {"message": f"Successfully processed {action} for document {document_id}"},
                    status=status.HTTP_200_OK
                )
            
            elif action == 'delete':
                # Remove from Django database
                try:
                    complaint = Complaint.objects.get(firestore_id=document_id)
                    complaint.delete()
                    logger.info(f"Deleted complaint {document_id} from Django database")
                except Complaint.DoesNotExist:
                    logger.warning(f"Complaint {document_id} not found in Django database")
                
                return Response(
                    {"message": f"Successfully processed delete for document {document_id}"},
                    status=status.HTTP_200_OK
                )
            
            else:
                return Response(
                    {"error": f"Unknown action: {action}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Error in Firestore webhook: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SyncComplaintView(APIView):
    """
    Endpoint to manually sync a specific complaint from Firestore
    """
    
    def post(self, request):
        """Sync a specific complaint from Firestore"""
        try:
            complaint_id = request.data.get('complaint_id')
            
            if not complaint_id:
                return Response(
                    {"error": "complaint_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            complaint = Complaint.sync_from_firestore(complaint_id)
            
            if complaint:
                return Response(
                    {"message": f"Successfully synced complaint {complaint_id}"},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"error": f"Failed to sync complaint {complaint_id}"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            logger.error(f"Error syncing complaint: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

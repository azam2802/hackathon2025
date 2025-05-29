from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from firebase_admin import firestore
from .services import process_report
from .email_service import send_status_update_email
import logging

logger = logging.getLogger(__name__)


class HelloWorld(APIView):
    def get(self, request):
        return Response({"message": "Hello, World!"}, status=status.HTTP_200_OK)


class ReportSubmissionView(APIView):
    def post(self, request):
        try:
            # Process the report
            result = process_report(request.data)

            if result["success"]:
                return Response(result["data"], status=status.HTTP_201_CREATED)
            else:
                return Response(
                    {"error": "Failed to save report to database"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StatusUpdateEmailView(APIView):
    def post(self, request):
        """Send email notification when complaint status is updated"""
        
        try:
            complaint_id = request.data.get('complaint_id')
            new_status = request.data.get('status')
            language = request.data.get('language', 'ru')
            
            if not complaint_id or not new_status:
                return Response(
                    {"error": "complaint_id and status are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Valid statuses
            valid_statuses = ['pending', 'resolved', 'cancelled']
            if new_status not in valid_statuses:
                return Response(
                    {"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get complaint data from Firestore
            db = firestore.client()
            complaint_ref = db.collection('reports').document(complaint_id)
            complaint_doc = complaint_ref.get()
            
            if not complaint_doc.exists:
                return Response(
                    {"error": "Complaint not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            complaint_data = complaint_doc.to_dict()
            complaint_data['id'] = complaint_id
            
            # Check if this is a website or mobile submission
            submission_source = complaint_data.get('submission_source', '')
            if submission_source not in ['website', 'mobile']:
                return Response(
                    {"message": "Email notification skipped - not a website or mobile submission"},
                    status=status.HTTP_200_OK
                )
            
            # Add any additional notes from the request
            notes = request.data.get('notes', '')
            if notes:
                complaint_data['notes'] = notes
            
            # Send email notification
            email_sent = send_status_update_email(complaint_data, new_status, language)
            
            if email_sent:
                return Response(
                    {"message": "Email notification sent successfully"},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"error": "Failed to send email notification"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            logger.error(f"Error in status update email endpoint: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

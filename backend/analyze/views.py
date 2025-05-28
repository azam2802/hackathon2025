from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import process_report


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

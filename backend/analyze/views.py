from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import process_report, get_city_coordinates


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


class GeocodeView(APIView):
    def post(self, request):
        try:
            address = request.data.get("city_name")
            if not address:
                return Response(
                    {"error": "Необходимо указать адрес"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Добавляем "Кыргызстан" к адресу для более точного поиска
            if not address.endswith("Кыргызстан"):
                address = f"{address}, Кыргызстан"

            coordinates = get_city_coordinates(address)
            if coordinates:
                return Response(
                    {
                        "success": True,
                        "data": {
                            "latitude": coordinates["latitude"],
                            "longitude": coordinates["longitude"],
                            "address": coordinates["address"],
                            "region": coordinates["region"],
                            "city": coordinates["city"],
                            "street": coordinates["street"],
                            "house_number": coordinates["house_number"],
                        },
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": "Адрес не найден"}, status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path
from analyze.views import HelloWorld, ReportSubmissionView, StatusUpdateEmailView
from analyze.webhook_views import FirestoreWebhookView, SyncComplaintView
from .geocoding import geocode_location

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/hello/", HelloWorld.as_view(), name="hello"),
    path("api/reports/", ReportSubmissionView.as_view(), name="submit_report"),
    path("api/geocode/", geocode_location, name="geocode"),
    path("api/send-status-email/", StatusUpdateEmailView.as_view(), name="send_status_email"),
    path("api/firestore-webhook/", FirestoreWebhookView.as_view(), name="firestore_webhook"),
    path("api/sync-complaint/", SyncComplaintView.as_view(), name="sync_complaint"),
]

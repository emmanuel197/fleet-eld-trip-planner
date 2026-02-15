"""
URL configuration for the trip_planner API.
All endpoints are prefixed with /api/ (configured in eld_project/urls.py).
"""

from django.urls import path
from .views import PlanTripView, TripDetailView, TripListView, HealthCheckView

urlpatterns = [
    # Health check
    path('health/', HealthCheckView.as_view(), name='health-check'),

    # Trip planning
    path('plan-trip/', PlanTripView.as_view(), name='plan-trip'),

    # Trip retrieval
    path('trip/<uuid:trip_id>/', TripDetailView.as_view(), name='trip-detail'),
    path('trips/', TripListView.as_view(), name='trip-list'),
]

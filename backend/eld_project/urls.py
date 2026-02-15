"""
URL configuration for eld_project.
Routes API requests to the trip_planner app.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('trip_planner.urls')),
]

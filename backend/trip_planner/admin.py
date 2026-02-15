"""Admin configuration for trip planner models."""

from django.contrib import admin
from .models import Trip, TripStop, DailyLog


class TripStopInline(admin.TabularInline):
    """Inline display of stops within a trip."""
    model = TripStop
    extra = 0
    readonly_fields = ['stop_type', 'location_name', 'miles_from_start', 'stop_duration_hours']


class DailyLogInline(admin.TabularInline):
    """Inline display of daily logs within a trip."""
    model = DailyLog
    extra = 0
    readonly_fields = ['day_number', 'date', 'driving_hours', 'on_duty_hours', 'total_miles_today']


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    """Admin view for Trip model."""
    list_display = [
        'id', 'current_location', 'pickup_location', 'dropoff_location',
        'total_distance_miles', 'total_trip_days', 'created_at'
    ]
    list_filter = ['created_at']
    search_fields = ['current_location', 'pickup_location', 'dropoff_location']
    inlines = [TripStopInline, DailyLogInline]
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(TripStop)
class TripStopAdmin(admin.ModelAdmin):
    """Admin view for TripStop model."""
    list_display = ['trip', 'stop_type', 'location_name', 'miles_from_start', 'sequence_order']
    list_filter = ['stop_type']


@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    """Admin view for DailyLog model."""
    list_display = ['trip', 'day_number', 'date', 'driving_hours', 'on_duty_hours', 'total_miles_today']

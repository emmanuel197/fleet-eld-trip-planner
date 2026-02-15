"""
Serializers for the trip planner API.
Handles validation of input data and serialization of response data.

Pattern: Follows the same ModelSerializer approach as the music_controller project,
with additional custom serializers for computed/nested data.
"""

from rest_framework import serializers
from .models import Trip, TripStop, DailyLog


class TripInputSerializer(serializers.Serializer):
    """
    Validates trip planning input from the frontend.
    This is not a ModelSerializer since we need to process the data
    before creating model instances.
    """
    current_location = serializers.CharField(
        max_length=255,
        help_text="Driver's current location"
    )
    pickup_location = serializers.CharField(
        max_length=255,
        help_text="Pickup location"
    )
    dropoff_location = serializers.CharField(
        max_length=255,
        help_text="Dropoff/delivery location"
    )
    current_cycle_used = serializers.FloatField(
        min_value=0.0,
        max_value=70.0,
        default=0.0,
        help_text="Hours already used in 70hr/8day cycle (0-70)"
    )


class TripStopSerializer(serializers.ModelSerializer):
    """Serializes individual stops along the route."""
    stop_type_display = serializers.CharField(
        source='get_stop_type_display',
        read_only=True
    )

    class Meta:
        model = TripStop
        fields = [
            'id', 'stop_type', 'stop_type_display', 'location_name',
            'latitude', 'longitude', 'miles_from_start',
            'hours_from_start', 'stop_duration_hours', 'sequence_order'
        ]


class DailyLogSerializer(serializers.ModelSerializer):
    """Serializes daily log sheet data for ELD grid rendering."""

    class Meta:
        model = DailyLog
        fields = [
            'id', 'day_number', 'date',
            'off_duty_hours', 'sleeper_berth_hours',
            'driving_hours', 'on_duty_hours',
            'total_miles_today', 'duty_status_entries', 'remarks'
        ]


class TripDetailSerializer(serializers.ModelSerializer):
    """
    Full trip serializer including nested stops and daily logs.
    Used for the detail response after trip calculation.
    """
    stops = TripStopSerializer(many=True, read_only=True)
    daily_logs = DailyLogSerializer(many=True, read_only=True)

    class Meta:
        model = Trip
        fields = [
            'id', 'current_location', 'pickup_location', 'dropoff_location',
            'current_cycle_used', 'cycle_hours_after_trip',
            'current_lat', 'current_lng',
            'pickup_lat', 'pickup_lng',
            'dropoff_lat', 'dropoff_lng',
            'total_distance_miles', 'total_duration_hours', 'total_trip_days',
            'route_geometry',
            'stops', 'daily_logs',
            'created_at', 'updated_at'
        ]


class TripListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing trips (no nested data)."""

    class Meta:
        model = Trip
        fields = [
            'id', 'current_location', 'pickup_location', 'dropoff_location',
            'total_distance_miles', 'total_trip_days', 'created_at'
        ]

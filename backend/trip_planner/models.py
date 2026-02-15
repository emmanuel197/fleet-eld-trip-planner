"""
Models for the trip planner application.
Stores trip data, route information, and generated ELD log entries.

Design Decisions:
- Trip model stores the input parameters and computed results
- TripStop model stores individual stops along the route (fuel, rest, pickup/dropoff)
- DailyLog model stores the computed daily log data for ELD sheet generation
"""

from django.db import models
import uuid


class Trip(models.Model):
    """
    Represents a planned truck trip with HOS compliance calculations.
    Stores both input parameters and computed route/schedule data.
    """

    # Unique identifier for API access
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # --- Input Fields ---
    current_location = models.CharField(
        max_length=255,
        help_text="Driver's current location (address or city, state)"
    )
    pickup_location = models.CharField(
        max_length=255,
        help_text="Pickup location (address or city, state)"
    )
    dropoff_location = models.CharField(
        max_length=255,
        help_text="Dropoff/delivery location (address or city, state)"
    )
    current_cycle_used = models.FloatField(
        default=0.0,
        help_text="Hours already used in the current 70hr/8day cycle"
    )

    # --- Geocoded Coordinates ---
    current_lat = models.FloatField(null=True, blank=True)
    current_lng = models.FloatField(null=True, blank=True)
    pickup_lat = models.FloatField(null=True, blank=True)
    pickup_lng = models.FloatField(null=True, blank=True)
    dropoff_lat = models.FloatField(null=True, blank=True)
    dropoff_lng = models.FloatField(null=True, blank=True)

    # --- Computed Route Data ---
    total_distance_miles = models.FloatField(
        null=True, blank=True,
        help_text="Total trip distance in miles"
    )
    total_duration_hours = models.FloatField(
        null=True, blank=True,
        help_text="Total estimated driving duration in hours"
    )
    total_trip_days = models.IntegerField(
        null=True, blank=True,
        help_text="Total number of days the trip will span"
    )

    # --- Route Geometry (encoded polyline for map display) ---
    route_geometry = models.JSONField(
        null=True, blank=True,
        help_text="Route coordinates for map display [[lat, lng], ...]"
    )

    # --- Metadata ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Trip'
        verbose_name_plural = 'Trips'

    def __str__(self):
        return f"Trip: {self.current_location} → {self.pickup_location} → {self.dropoff_location}"


class TripStop(models.Model):
    """
    Represents a stop along the trip route.
    Includes fuel stops, rest stops, the pickup, and the dropoff.
    """

    STOP_TYPE_CHOICES = [
        ('start', 'Trip Start'),
        ('fuel', 'Fuel Stop'),
        ('rest', 'Rest Break (30 min)'),
        ('sleep', 'Sleep/Off-Duty (10 hr)'),
        ('pickup', 'Pickup'),
        ('dropoff', 'Dropoff'),
    ]

    trip = models.ForeignKey(
        Trip,
        on_delete=models.CASCADE,
        related_name='stops'
    )
    stop_type = models.CharField(max_length=20, choices=STOP_TYPE_CHOICES)
    location_name = models.CharField(
        max_length=255,
        help_text="City/address name of the stop"
    )
    latitude = models.FloatField()
    longitude = models.FloatField()

    # Distance and time from trip start to this stop
    miles_from_start = models.FloatField(
        default=0.0,
        help_text="Cumulative miles from trip start"
    )
    hours_from_start = models.FloatField(
        default=0.0,
        help_text="Cumulative driving hours from trip start"
    )

    # Duration of the stop itself
    stop_duration_hours = models.FloatField(
        default=0.0,
        help_text="How long the driver stops here (hours)"
    )

    # Sequence order along the route
    sequence_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['sequence_order']
        verbose_name = 'Trip Stop'
        verbose_name_plural = 'Trip Stops'

    def __str__(self):
        return f"{self.get_stop_type_display()} at {self.location_name}"


class DailyLog(models.Model):
    """
    Represents a single day's ELD log (Driver's Daily Log sheet).
    Contains the duty status timeline for drawing the log grid.
    """

    trip = models.ForeignKey(
        Trip,
        on_delete=models.CASCADE,
        related_name='daily_logs'
    )
    day_number = models.IntegerField(
        help_text="Day number in the trip (1-indexed)"
    )
    date = models.DateField(
        help_text="Calendar date for this log"
    )

    # Total hours per duty status (must sum to 24)
    off_duty_hours = models.FloatField(default=0.0)
    sleeper_berth_hours = models.FloatField(default=0.0)
    driving_hours = models.FloatField(default=0.0)
    on_duty_hours = models.FloatField(default=0.0)

    # Miles driven this day
    total_miles_today = models.FloatField(default=0.0)

    # Duty status timeline: list of segments for drawing the grid
    # Format: [{"status": "off_duty|sleeper|driving|on_duty",
    #           "start_hour": 0.0, "end_hour": 6.5,
    #           "location": "City, ST", "remarks": "Pre-trip"}]
    duty_status_entries = models.JSONField(
        default=list,
        help_text="Timeline of duty status changes for drawing the ELD grid"
    )

    # Remarks entries (location + activity at each status change)
    remarks = models.JSONField(
        default=list,
        help_text="List of remarks: [{location, activity, time}]"
    )

    class Meta:
        ordering = ['day_number']
        unique_together = ['trip', 'day_number']
        verbose_name = 'Daily Log'
        verbose_name_plural = 'Daily Logs'

    def __str__(self):
        return f"Day {self.day_number} Log - {self.date}"

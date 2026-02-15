"""
API Views for the trip planner.

Pattern: Uses DRF APIView (consistent with music_controller project)
with class-based views for each endpoint.

Endpoints:
- POST /api/plan-trip/     → Plan a new trip (geocode, route, HOS calc)
- GET  /api/trip/<id>/      → Get trip details with stops and logs
- GET  /api/trips/          → List all trips
- GET  /api/health/         → Health check endpoint
"""

import logging
from datetime import datetime

from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Trip, TripStop, DailyLog
from .serializers import (
    TripInputSerializer,
    TripDetailSerializer,
    TripListSerializer,
)
from .route_service import (
    geocode_address,
    calculate_route,
    get_location_at_distance,
    reverse_geocode,
)
from .hos_calculator import HOSCalculator

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """Simple health check endpoint for monitoring."""

    def get(self, request, format=None):
        return Response(
            {"status": "healthy", "service": "Fleet ELD Trip Planner API"},
            status=status.HTTP_200_OK
        )


class PlanTripView(APIView):
    """
    Plan a new trip with HOS-compliant schedule.
    
    Accepts trip inputs (locations + cycle hours), geocodes addresses,
    calculates the route, runs HOS simulation, and returns the full
    trip plan with stops and daily log data.
    
    POST /api/plan-trip/
    Body: {
        "current_location": "Chicago, IL",
        "pickup_location": "Indianapolis, IN",
        "dropoff_location": "Miami, FL",
        "current_cycle_used": 10.0
    }
    """
    serializer_class = TripInputSerializer

    def post(self, request, format=None):
        # Validate input
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        logger.info(f"Planning trip: {data['current_location']} → {data['pickup_location']} → {data['dropoff_location']}")

        try:
            # ============================================================
            # STEP 1: Geocode all three locations
            # ============================================================
            current_geo = geocode_address(data['current_location'])
            pickup_geo = geocode_address(data['pickup_location'])
            dropoff_geo = geocode_address(data['dropoff_location'])

            if not all([current_geo, pickup_geo, dropoff_geo]):
                missing = []
                if not current_geo:
                    missing.append('current_location')
                if not pickup_geo:
                    missing.append('pickup_location')
                if not dropoff_geo:
                    missing.append('dropoff_location')
                return Response(
                    {"error": f"Could not geocode: {', '.join(missing)}. Please check the addresses."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ============================================================
            # STEP 2: Calculate route (current → pickup → dropoff)
            # ============================================================
            # Route leg 1: current → pickup
            route_to_pickup = calculate_route(
                origin=(current_geo.latitude, current_geo.longitude),
                destination=(pickup_geo.latitude, pickup_geo.longitude)
            )

            # Route leg 2: pickup → dropoff
            route_to_dropoff = calculate_route(
                origin=(pickup_geo.latitude, pickup_geo.longitude),
                destination=(dropoff_geo.latitude, dropoff_geo.longitude)
            )

            if not route_to_pickup or not route_to_dropoff:
                return Response(
                    {"error": "Could not calculate driving route. Please verify the locations are accessible by road."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Combine route data
            total_miles = route_to_pickup.total_distance_miles + route_to_dropoff.total_distance_miles
            total_hours = route_to_pickup.total_duration_hours + route_to_dropoff.total_duration_hours
            combined_geometry = route_to_pickup.geometry + route_to_dropoff.geometry
            combined_segments = route_to_pickup.segments + route_to_dropoff.segments

            # ============================================================
            # STEP 3: Run HOS calculation
            # ============================================================
            calculator = HOSCalculator(
                total_miles=total_miles,
                total_driving_hours=total_hours,
                current_cycle_used=data['current_cycle_used'],
                pickup_miles=route_to_pickup.total_distance_miles,
                pickup_hours=route_to_pickup.total_duration_hours,
                route_segments=combined_segments,
                start_time=datetime.now().replace(hour=8, minute=0, second=0, microsecond=0)
            )

            stops, daily_logs, final_cycle_hours = calculator.calculate()

            # ============================================================
            # STEP 4: Assign coordinates to stops
            # ============================================================
            for stop in stops:
                if stop.stop_type == 'start':
                    stop.latitude = current_geo.latitude
                    stop.longitude = current_geo.longitude
                    stop.location_name = data['current_location']
                elif stop.stop_type == 'pickup':
                    stop.latitude = pickup_geo.latitude
                    stop.longitude = pickup_geo.longitude
                    stop.location_name = data['pickup_location']
                elif stop.stop_type == 'dropoff':
                    stop.latitude = dropoff_geo.latitude
                    stop.longitude = dropoff_geo.longitude
                    stop.location_name = data['dropoff_location']
                else:
                    # For fuel/rest/sleep stops, interpolate position on route
                    coords = get_location_at_distance(
                        combined_geometry,
                        stop.miles_from_start,
                        total_miles
                    )
                    stop.latitude = coords[0]
                    stop.longitude = coords[1]
                    # Reverse geocode to get a real location name
                    if coords[0] != 0.0:
                        try:
                            stop.location_name = reverse_geocode(coords[0], coords[1])
                        except Exception:
                            pass  # Keep the existing generic name

            # ============================================================
            # STEP 5: Save to database
            # ============================================================
            trip = Trip.objects.create(
                current_location=data['current_location'],
                pickup_location=data['pickup_location'],
                dropoff_location=data['dropoff_location'],
                current_cycle_used=data['current_cycle_used'],
                current_lat=current_geo.latitude,
                current_lng=current_geo.longitude,
                pickup_lat=pickup_geo.latitude,
                pickup_lng=pickup_geo.longitude,
                dropoff_lat=dropoff_geo.latitude,
                dropoff_lng=dropoff_geo.longitude,
                total_distance_miles=total_miles,
                total_duration_hours=total_hours,
                total_trip_days=len(daily_logs),
                route_geometry=combined_geometry,
                cycle_hours_after_trip=final_cycle_hours,
            )

            # Save stops
            for stop in stops:
                TripStop.objects.create(
                    trip=trip,
                    stop_type=stop.stop_type,
                    location_name=stop.location_name,
                    latitude=stop.latitude,
                    longitude=stop.longitude,
                    miles_from_start=stop.miles_from_start,
                    hours_from_start=stop.driving_hours_from_start,
                    stop_duration_hours=stop.stop_duration_hours,
                    sequence_order=stop.sequence_order,
                )

            # Save daily logs
            for log in daily_logs:
                # Convert DutyStatusEntry objects to dicts for JSON storage
                entries_data = [
                    {
                        'status': entry.status,
                        'start_hour': entry.start_hour,
                        'end_hour': entry.end_hour,
                        'location': entry.location,
                        'remarks': entry.remarks,
                    }
                    for entry in log.duty_status_entries
                ]

                DailyLog.objects.create(
                    trip=trip,
                    day_number=log.day_number,
                    date=log.date,
                    off_duty_hours=log.off_duty_hours,
                    sleeper_berth_hours=log.sleeper_berth_hours,
                    driving_hours=log.driving_hours,
                    on_duty_hours=log.on_duty_hours,
                    total_miles_today=log.total_miles_today,
                    duty_status_entries=entries_data,
                    remarks=log.remarks,
                )

            # ============================================================
            # STEP 6: Return the full trip response
            # ============================================================
            response_serializer = TripDetailSerializer(trip)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Trip planning error: {e}", exc_info=True)
            return Response(
                {"error": f"An error occurred while planning the trip: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TripDetailView(APIView):
    """
    Get full details for a specific trip.
    
    GET /api/trip/<uuid:trip_id>/
    """

    def get(self, request, trip_id, format=None):
        try:
            trip = Trip.objects.get(id=trip_id)
        except Trip.DoesNotExist:
            return Response(
                {"error": "Trip not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = TripDetailSerializer(trip)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TripListView(generics.ListAPIView):
    """
    List all planned trips (most recent first).
    
    GET /api/trips/
    """
    queryset = Trip.objects.all()
    serializer_class = TripListSerializer

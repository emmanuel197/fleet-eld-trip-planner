from datetime import datetime
from unittest.mock import patch
from types import SimpleNamespace

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .hos_calculator import HOSCalculator, MAX_DRIVING_HOURS
from .models import Trip, TripStop, DailyLog

START = datetime(2026, 1, 5, 8, 0, 0)


class HOSCalculatorShortTripTests(TestCase):
    """A 200-mile run: fits in one shift, no fuel or sleep stops."""

    def setUp(self):
        self.stops, self.logs, self.final_cycle = HOSCalculator(
            total_miles=200.0,
            total_driving_hours=200.0 / 55.0,
            current_cycle_used=0.0,
            pickup_miles=50.0,
            pickup_hours=50.0 / 55.0,
            route_segments=[],
            start_time=START,
        ).calculate()

    def test_includes_start_pickup_and_dropoff_stops(self):
        types = [s.stop_type for s in self.stops]
        for required in ("start", "pickup", "dropoff"):
            self.assertIn(required, types)

    def test_no_fuel_stop_under_1000_miles(self):
        self.assertNotIn("fuel", [s.stop_type for s in self.stops])

    def test_single_day_trip(self):
        self.assertEqual(len(self.logs), 1)

    def test_cycle_hours_increase_from_zero(self):
        self.assertGreater(self.final_cycle, 0.0)

    def test_stops_are_sequenced(self):
        orders = [s.sequence_order for s in self.stops]
        self.assertEqual(orders, sorted(orders))


class HOSCalculatorLongTripTests(TestCase):
    """A 2,200-mile run: must split across days with fuel and sleep stops."""

    def setUp(self):
        self.stops, self.logs, self.final_cycle = HOSCalculator(
            total_miles=2200.0,
            total_driving_hours=2200.0 / 55.0,
            current_cycle_used=10.0,
            pickup_miles=100.0,
            pickup_hours=100.0 / 55.0,
            route_segments=[],
            start_time=START,
        ).calculate()

    def test_multi_day_trip(self):
        self.assertGreater(len(self.logs), 1)

    def test_has_fuel_stops_at_least_every_1000_miles(self):
        fuel_stops = [s for s in self.stops if s.stop_type == "fuel"]
        self.assertGreaterEqual(len(fuel_stops), 2)

    def test_has_overnight_sleep_stops(self):
        self.assertIn("sleep", [s.stop_type for s in self.stops])

    def test_daily_driving_never_exceeds_11_hours(self):
        for log in self.logs:
            self.assertLessEqual(log.driving_hours, MAX_DRIVING_HOURS + 1e-6)


class TripModelTests(TestCase):
    def test_str_shows_route(self):
        trip = Trip.objects.create(
            current_location="Chicago, IL",
            pickup_location="Indianapolis, IN",
            dropoff_location="Miami, FL",
        )
        self.assertEqual(
            str(trip), "Trip: Chicago, IL → Indianapolis, IN → Miami, FL",
        )

    def test_trips_ordered_newest_first(self):
        from django.utils import timezone
        from datetime import timedelta

        first = Trip.objects.create(
            current_location="A", pickup_location="B", dropoff_location="C",
        )
        second = Trip.objects.create(
            current_location="D", pickup_location="E", dropoff_location="F",
        )
        # created_at is auto_now_add, so same-tick creations can tie. Force
        # distinct timestamps to characterize the Meta ordering ('-created_at').
        now = timezone.now()
        Trip.objects.filter(pk=first.pk).update(created_at=now - timedelta(hours=1))
        Trip.objects.filter(pk=second.pk).update(created_at=now)
        self.assertEqual(list(Trip.objects.all()), [second, first])


class HealthEndpointTests(APITestCase):
    def test_health_check_returns_healthy(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["status"], "healthy")


class TripEndpointTests(APITestCase):
    def test_trip_detail_404_for_unknown_id(self):
        response = self.client.get(
            "/api/trip/00000000-0000-0000-0000-000000000000/",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_trip_list_returns_existing_trips(self):
        Trip.objects.create(
            current_location="A", pickup_location="B", dropoff_location="C",
        )
        response = self.client.get("/api/trips/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)


def fake_geo(lat, lng):
    return SimpleNamespace(latitude=lat, longitude=lng)


def fake_route(miles, hours):
    return SimpleNamespace(
        total_distance_miles=miles,
        total_duration_hours=hours,
        geometry=[[41.8, -87.6], [39.7, -86.1]],
        segments=[],
    )


class PlanTripEndpointTests(APITestCase):
    """plan-trip with all external geo/route services mocked out."""

    PAYLOAD = {
        "current_location": "Chicago, IL",
        "pickup_location": "Indianapolis, IN",
        "dropoff_location": "Nashville, TN",
        "current_cycle_used": 5.0,
    }

    @patch("trip_planner.views.get_location_at_distance", return_value=(40.0, -86.0))
    @patch("trip_planner.views.reverse_geocode", return_value="Somewhere, US")
    @patch("trip_planner.views.calculate_route")
    @patch("trip_planner.views.geocode_address")
    def test_plan_trip_creates_trip_with_stops_and_logs(
        self, mock_geocode, mock_route, _mock_reverse, _mock_loc,
    ):
        mock_geocode.side_effect = [
            fake_geo(41.88, -87.63), fake_geo(39.77, -86.16), fake_geo(36.16, -86.78),
        ]
        mock_route.side_effect = [fake_route(180.0, 3.3), fake_route(290.0, 5.3)]

        response = self.client.post("/api/plan-trip/", self.PAYLOAD, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Trip.objects.count(), 1)
        trip = Trip.objects.get()
        self.assertAlmostEqual(trip.total_distance_miles, 470.0)
        self.assertGreater(trip.stops.count(), 0)
        self.assertGreater(trip.daily_logs.count(), 0)

    def test_plan_trip_rejects_missing_fields(self):
        response = self.client.post("/api/plan-trip/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Trip.objects.count(), 0)

    @patch("trip_planner.views.geocode_address", return_value=None)
    def test_plan_trip_400_when_geocoding_fails(self, _mock_geocode):
        response = self.client.post("/api/plan-trip/", self.PAYLOAD, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

from django.apps import AppConfig


class TripPlannerConfig(AppConfig):
    """Configuration for the trip_planner Django app."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'trip_planner'
    verbose_name = 'Trip Planner & ELD Logs'

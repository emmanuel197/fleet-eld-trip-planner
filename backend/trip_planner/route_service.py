"""
Route Service

Handles geocoding (address → coordinates) and route calculation
using free, open-source APIs:
- Nominatim (OpenStreetMap) for geocoding
- OSRM (Open Source Routing Machine) for route calculation

No API keys required — fully free and open source.

Features:
- Rate limiting for Nominatim (1 request/second)
- Automatic retry with exponential backoff
- Django cache integration for geocoding results
- Robust error handling

Note: For production, consider hosting your own Nominatim instance
or using a paid geocoding service.
"""

import logging
import time
import hashlib
import requests
from typing import Optional, Tuple, List, Dict
from dataclasses import dataclass, asdict
from functools import wraps

from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)

# =============================================================================
# API ENDPOINTS (free, no API key required)
# =============================================================================

NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org"
OSRM_BASE_URL = "https://router.project-osrm.org"

# User-Agent required by Nominatim usage policy
HEADERS = {
    "User-Agent": "FleetELDTripPlanner/1.0 (educational-project)"
}

# Rate limiting for Nominatim (max 1 req/sec)
_last_nominatim_call = 0

# Retry configuration
MAX_RETRIES = 3
INITIAL_RETRY_DELAY = 1.0  # seconds

METERS_TO_MILES = 0.000621371
SECONDS_TO_HOURS = 1 / 3600

# Cache timeouts (fallback if not in settings)
DEFAULT_CACHE_TIMEOUTS = {
    'geocode': 86400,   # 24 hours
    'route': 3600,      # 1 hour
}


def _get_cache_timeout(cache_type: str) -> int:
    """Get cache timeout from settings or use default."""
    timeouts = getattr(settings, 'CACHE_TIMEOUTS', DEFAULT_CACHE_TIMEOUTS)
    return timeouts.get(cache_type, DEFAULT_CACHE_TIMEOUTS.get(cache_type, 3600))


def _make_cache_key(prefix: str, *args) -> str:
    """Create a cache key from prefix and arguments."""
    key_data = f"{prefix}:{':'.join(str(a) for a in args)}"
    # Use hash to keep key length manageable
    return f"eld:{prefix}:{hashlib.md5(key_data.encode()).hexdigest()[:16]}"


@dataclass
class GeocodedLocation:
    """Represents a geocoded location with coordinates."""
    address: str
    latitude: float
    longitude: float
    display_name: str
    
    def to_dict(self) -> dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict) -> 'GeocodedLocation':
        return cls(**data)


@dataclass
class RouteResult:
    """Represents the result of a route calculation."""
    total_distance_miles: float
    total_duration_hours: float
    geometry: List[List[float]]  # [[lat, lng], ...]
    segments: List[Dict]         # Route segments with names
    
    def to_dict(self) -> dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict) -> 'RouteResult':
        return cls(**data)


def retry_with_backoff(max_retries: int = MAX_RETRIES, initial_delay: float = INITIAL_RETRY_DELAY):
    """Decorator that retries a function with exponential backoff on failure."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except requests.RequestException as e:
                    last_exception = e
                    if attempt < max_retries:
                        delay = initial_delay * (2 ** attempt)
                        logger.warning(
                            f"{func.__name__} failed (attempt {attempt + 1}/{max_retries + 1}), "
                            f"retrying in {delay:.1f}s: {e}"
                        )
                        time.sleep(delay)
                    else:
                        logger.error(f"{func.__name__} failed after {max_retries + 1} attempts: {e}")
            raise last_exception
        return wrapper
    return decorator


def _rate_limit_nominatim():
    """Ensure we don't exceed Nominatim's 1 request/second limit."""
    global _last_nominatim_call
    now = time.time()
    elapsed = now - _last_nominatim_call
    if elapsed < 1.2:  # Slightly more than 1 second for safety
        time.sleep(1.2 - elapsed)
    _last_nominatim_call = time.time()


def geocode_address(address: str, use_cache: bool = True) -> Optional[GeocodedLocation]:
    """
    Convert an address string to geographic coordinates using Nominatim.
    Results are cached for 24 hours to reduce API calls.
    
    Args:
        address: Address string (e.g., "Chicago, IL")
        use_cache: Whether to use cached results (default: True)
    
    Returns:
        GeocodedLocation if found, None otherwise
    """
    # Check cache first
    cache_key = _make_cache_key('geo', address.lower().strip())
    if use_cache:
        cached = cache.get(cache_key)
        if cached is not None:
            logger.debug(f"Cache hit for geocode: {address}")
            if cached == 'NOT_FOUND':
                return None
            return GeocodedLocation.from_dict(cached)
    
    # Cache miss - make API call
    result = _geocode_address_api(address)
    
    # Cache the result
    timeout = _get_cache_timeout('geocode')
    if result:
        cache.set(cache_key, result.to_dict(), timeout)
    else:
        # Cache negative results for shorter time
        cache.set(cache_key, 'NOT_FOUND', timeout // 4)
    
    return result


@retry_with_backoff(max_retries=3, initial_delay=2.0)
def _geocode_address_api(address: str) -> Optional[GeocodedLocation]:
    """Internal function that makes the actual Nominatim API call."""
    _rate_limit_nominatim()

    params = {
        "q": address,
        "format": "json",
        "limit": 1,
        "countrycodes": "us",
    }

    response = requests.get(
        f"{NOMINATIM_BASE_URL}/search",
        params=params,
        headers=HEADERS,
        timeout=15
    )
    response.raise_for_status()

    results = response.json()
    if not results:
        logger.warning(f"No geocoding results for: {address}")
        return None

    result = results[0]
    location = GeocodedLocation(
        address=address,
        latitude=float(result["lat"]),
        longitude=float(result["lon"]),
        display_name=result.get("display_name", address)
    )

    logger.info(f"Geocoded '{address}' → ({location.latitude}, {location.longitude})")
    return location


def calculate_route(
    origin: Tuple[float, float],
    destination: Tuple[float, float],
    waypoints: List[Tuple[float, float]] = None,
    use_cache: bool = True
) -> Optional[RouteResult]:
    """
    Calculate a driving route using OSRM.
    Results are cached for 1 hour.
    
    Args:
        origin: (latitude, longitude) of the origin
        destination: (latitude, longitude) of the destination
        waypoints: Optional list of (lat, lng) waypoints
        use_cache: Whether to use cached results (default: True)
    
    Returns:
        RouteResult if successful, None otherwise
    """
    # Build cache key from coordinates
    wp_str = ','.join(f"{w[0]:.4f},{w[1]:.4f}" for w in (waypoints or []))
    cache_key = _make_cache_key(
        'route',
        f"{origin[0]:.4f},{origin[1]:.4f}",
        f"{destination[0]:.4f},{destination[1]:.4f}",
        wp_str
    )
    
    if use_cache:
        cached = cache.get(cache_key)
        if cached is not None:
            logger.debug(f"Cache hit for route")
            return RouteResult.from_dict(cached)
    
    # Cache miss - make API call
    result = _calculate_route_api(origin, destination, waypoints)
    
    # Cache the result
    if result:
        timeout = _get_cache_timeout('route')
        cache.set(cache_key, result.to_dict(), timeout)
    
    return result


@retry_with_backoff(max_retries=3, initial_delay=2.0)
def _calculate_route_api(
    origin: Tuple[float, float],
    destination: Tuple[float, float],
    waypoints: List[Tuple[float, float]] = None
) -> Optional[RouteResult]:
    """Internal function that makes the actual OSRM API call."""
    # OSRM expects coordinates as lng,lat (reversed from lat,lng)
    coords = [f"{origin[1]},{origin[0]}"]

    if waypoints:
        for wp in waypoints:
            coords.append(f"{wp[1]},{wp[0]}")

    coords.append(f"{destination[1]},{destination[0]}")
    coordinates_str = ";".join(coords)

    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "true",
    }

    response = requests.get(
        f"{OSRM_BASE_URL}/route/v1/driving/{coordinates_str}",
        params=params,
        timeout=45
    )
    response.raise_for_status()

    data = response.json()

    if data.get("code") != "Ok" or not data.get("routes"):
        logger.warning(f"OSRM returned no route: {data.get('code')}")
        return None

    route = data["routes"][0]

    total_distance_miles = route["distance"] * METERS_TO_MILES
    total_duration_hours = route["duration"] * SECONDS_TO_HOURS

    geometry_coords = route["geometry"]["coordinates"]
    geometry = [[coord[1], coord[0]] for coord in geometry_coords]

    segments = []
    for leg in route.get("legs", []):
        for step in leg.get("steps", []):
            if step.get("name") and step["name"] != "":
                segments.append({
                    "name": step["name"],
                    "distance_miles": step["distance"] * METERS_TO_MILES,
                    "duration_hours": step["duration"] * SECONDS_TO_HOURS,
                })

    result = RouteResult(
        total_distance_miles=round(total_distance_miles, 1),
        total_duration_hours=round(total_duration_hours, 2),
        geometry=geometry,
        segments=segments
    )

    logger.info(
        f"Route calculated: {result.total_distance_miles} miles, "
        f"{result.total_duration_hours} hours"
    )
    return result


def get_location_at_distance(
    geometry: List[List[float]],
    target_miles: float,
    total_miles: float
) -> Tuple[float, float]:
    """
    Get the approximate coordinates at a given distance along the route.
    """
    if not geometry or total_miles <= 0:
        return (0.0, 0.0)

    progress = min(target_miles / total_miles, 1.0)
    target_index = int(progress * (len(geometry) - 1))
    target_index = max(0, min(target_index, len(geometry) - 1))

    return tuple(geometry[target_index])


def reverse_geocode(lat: float, lng: float, use_cache: bool = True) -> str:
    """
    Convert coordinates back to a human-readable location name.
    Results are cached for 24 hours.
    """
    cache_key = _make_cache_key('revgeo', f"{lat:.4f}", f"{lng:.4f}")
    
    if use_cache:
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
    
    result = _reverse_geocode_api(lat, lng)
    
    timeout = _get_cache_timeout('geocode')
    cache.set(cache_key, result, timeout)
    
    return result


@retry_with_backoff(max_retries=2, initial_delay=1.5)
def _reverse_geocode_api(lat: float, lng: float) -> str:
    """Internal function that makes the actual reverse geocode API call."""
    _rate_limit_nominatim()

    params = {
        "lat": lat,
        "lon": lng,
        "format": "json",
        "zoom": 10,
    }

    response = requests.get(
        f"{NOMINATIM_BASE_URL}/reverse",
        params=params,
        headers=HEADERS,
        timeout=15
    )
    response.raise_for_status()

    data = response.json()
    address = data.get("address", {})

    city = (
        address.get("city") or
        address.get("town") or
        address.get("village") or
        address.get("county", "Unknown")
    )
    state = address.get("state", "")
    state_abbr = _abbreviate_state(state)

    return f"{city}, {state_abbr}" if state_abbr else city


def _abbreviate_state(state_name: str) -> str:
    """Convert full state name to abbreviation."""
    states = {
        "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
        "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
        "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
        "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
        "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
        "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
        "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
        "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
        "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
        "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
        "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
        "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
        "Wisconsin": "WI", "Wyoming": "WY", "District of Columbia": "DC",
    }
    return states.get(state_name, state_name[:2].upper() if state_name else "")

"""
HOS (Hours of Service) Compliance Calculator

Implements FMCSA regulations for property-carrying drivers:
- 70-hour/8-day cycle (no adverse driving conditions)
- 11-hour driving limit per shift
- 14-hour driving window per shift
- 30-minute break after 8 cumulative driving hours
- 10-hour mandatory off-duty between shifts
- Fueling at least every 1,000 miles
- 1 hour for pickup and dropoff operations

Reference: FMCSA Interstate Truck Driver's Guide to Hours of Service (April 2022)
"""

import logging
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import List

logger = logging.getLogger(__name__)

# =============================================================================
# HOS CONSTANTS (FMCSA Property-Carrying, 70hr/8day)
# =============================================================================

MAX_DRIVING_HOURS = 11.0       # Max driving hours per shift
MAX_DUTY_WINDOW = 14.0         # Max hours in duty window before must stop driving
MANDATORY_BREAK_AFTER = 8.0    # Must take 30-min break after 8 hrs cumulative driving
MANDATORY_BREAK_DURATION = 0.5 # 30-minute break
MIN_OFF_DUTY_HOURS = 10.0      # Minimum off-duty between shifts
MAX_CYCLE_HOURS = 70.0         # 70-hour/8-day cycle limit
FUEL_INTERVAL_MILES = 1000.0   # Must fuel at least every 1,000 miles
PICKUP_DURATION = 1.0          # 1 hour for pickup operations
DROPOFF_DURATION = 1.0         # 1 hour for dropoff operations
AVERAGE_SPEED_MPH = 55.0       # Average truck speed for time estimation
FUEL_STOP_DURATION = 0.5       # 30 minutes for fueling
PRE_TRIP_INSPECTION = 0.25     # 15 minutes pre-trip inspection (on-duty)
POST_TRIP_INSPECTION = 0.25    # 15 minutes post-trip inspection (on-duty)


@dataclass
class DutyStatusEntry:
    """Represents a single duty status segment in a daily log."""
    status: str           # 'off_duty', 'sleeper', 'driving', 'on_duty'
    start_hour: float     # Start time (0.0 - 24.0) within the day
    end_hour: float       # End time (0.0 - 24.0) within the day
    location: str = ""    # City, ST where this status starts
    remarks: str = ""     # Activity description


@dataclass
class StopInfo:
    """Represents a planned stop along the route."""
    stop_type: str        # 'start', 'fuel', 'rest', 'sleep', 'pickup', 'dropoff'
    location_name: str
    latitude: float
    longitude: float
    miles_from_start: float
    driving_hours_from_start: float
    stop_duration_hours: float
    sequence_order: int


@dataclass
class DailyLogData:
    """Represents one day's log sheet data."""
    day_number: int
    date: datetime
    off_duty_hours: float = 0.0
    sleeper_berth_hours: float = 0.0
    driving_hours: float = 0.0
    on_duty_hours: float = 0.0
    total_miles_today: float = 0.0
    duty_status_entries: List[DutyStatusEntry] = field(default_factory=list)
    remarks: list = field(default_factory=list)


class HOSCalculator:
    """
    Calculates HOS-compliant trip schedule including stops, breaks,
    and daily log sheet data.
    
    Usage:
        calculator = HOSCalculator(
            total_miles=1500,
            total_driving_hours=27.3,
            current_cycle_used=20.0,
            pickup_miles=50,        # miles from current to pickup
            pickup_hours=0.9,
            route_segments=[...],   # for location names at stops
            start_time=datetime.now()
        )
        stops, daily_logs = calculator.calculate()
    """

    def __init__(
        self,
        total_miles: float,
        total_driving_hours: float,
        current_cycle_used: float,
        pickup_miles: float,
        pickup_hours: float,
        route_segments: list = None,
        start_time: datetime = None,
    ):
        self.total_miles = total_miles
        self.total_driving_hours = total_driving_hours
        self.current_cycle_used = current_cycle_used
        self.pickup_miles = pickup_miles
        self.pickup_hours = pickup_hours
        self.route_segments = route_segments or []
        self.start_time = start_time or datetime.now().replace(
            hour=8, minute=0, second=0, microsecond=0
        )

        # State tracking during simulation
        self._current_time = self.start_time
        self._miles_driven = 0.0
        self._shift_driving_hours = 0.0
        self._shift_duty_hours = 0.0
        self._driving_since_break = 0.0
        self._cycle_hours_used = current_cycle_used
        self._miles_since_fuel = 0.0
        self._stops: List[StopInfo] = []
        self._daily_logs: List[DailyLogData] = []
        self._stop_sequence = 0
        self._current_day_entries: List[DutyStatusEntry] = []
        self._current_day_miles = 0.0
        self._day_start_time = self.start_time

    def calculate(self):
        """
        Run the HOS simulation and return planned stops and daily logs.
        
        Returns:
            tuple: (list of StopInfo, list of DailyLogData)
        """
        logger.info(
            f"Calculating HOS schedule: {self.total_miles:.0f} miles, "
            f"{self.total_driving_hours:.1f} hrs driving, "
            f"{self.current_cycle_used:.1f} hrs cycle used"
        )

        # --- Add start point ---
        self._add_stop('start', 'Trip Start', 0, 0, 0)
        self._add_duty_entry('off_duty', 0, self._current_time.hour + self._current_time.minute / 60.0, 'Trip Start', 'Off Duty')

        # --- Pre-trip inspection (on-duty, not driving) ---
        self._add_duty_entry(
            'on_duty',
            self._current_time.hour + self._current_time.minute / 60.0,
            self._current_time.hour + self._current_time.minute / 60.0 + PRE_TRIP_INSPECTION,
            'Trip Start',
            'Pre-trip inspection'
        )
        self._advance_time(PRE_TRIP_INSPECTION, is_driving=False, is_on_duty=True)

        # --- Drive to pickup ---
        if self.pickup_miles > 0:
            self._simulate_driving_segment(
                self.pickup_miles,
                self.pickup_hours,
                destination_name='Pickup Location',
                is_to_pickup=True
            )

        # --- Pickup operations (1 hour on-duty) ---
        pickup_start = self._get_hour_of_day()
        self._add_stop('pickup', 'Pickup Location', self._miles_driven, self._get_total_driving(), PICKUP_DURATION)
        self._add_duty_entry('on_duty', pickup_start, pickup_start + PICKUP_DURATION, 'Pickup Location', 'Loading/Pickup')
        self._add_remark('Pickup Location', 'Loading/Pickup operations')
        self._advance_time(PICKUP_DURATION, is_driving=False, is_on_duty=True)

        # --- Drive from pickup to dropoff ---
        remaining_miles = self.total_miles - self.pickup_miles
        remaining_hours = self.total_driving_hours - self.pickup_hours
        if remaining_miles > 0:
            self._simulate_driving_segment(
                remaining_miles,
                remaining_hours,
                destination_name='Dropoff Location',
                is_to_pickup=False
            )

        # --- Dropoff operations (1 hour on-duty) ---
        dropoff_start = self._get_hour_of_day()
        self._add_stop('dropoff', 'Dropoff Location', self._miles_driven, self._get_total_driving(), DROPOFF_DURATION)
        self._add_duty_entry('on_duty', dropoff_start, dropoff_start + DROPOFF_DURATION, 'Dropoff Location', 'Unloading/Dropoff')
        self._add_remark('Dropoff Location', 'Unloading/Dropoff operations')
        self._advance_time(DROPOFF_DURATION, is_driving=False, is_on_duty=True)

        # --- Post-trip inspection ---
        post_start = self._get_hour_of_day()
        self._add_duty_entry('on_duty', post_start, post_start + POST_TRIP_INSPECTION, 'Dropoff Location', 'Post-trip inspection')
        self._advance_time(POST_TRIP_INSPECTION, is_driving=False, is_on_duty=True)

        # --- Fill remaining day with off-duty/sleeper ---
        self._finalize_current_day()

        logger.info(f"Trip planned: {len(self._stops)} stops, {len(self._daily_logs)} daily logs, final cycle: {self._cycle_hours_used:.1f}h")
        return self._stops, self._daily_logs, self._cycle_hours_used

    def _simulate_driving_segment(
        self, segment_miles, segment_hours, destination_name, is_to_pickup
    ):
        """
        Simulate driving a segment of the route, inserting HOS-required
        breaks, fuel stops, and rest periods as needed.
        """
        miles_remaining = segment_miles
        hours_remaining = segment_hours

        while miles_remaining > 0.5:  # small threshold to avoid floating-point issues
            # Calculate how far we can drive before hitting any limit
            max_drive_before_break = MANDATORY_BREAK_AFTER - self._driving_since_break
            max_drive_in_shift = MAX_DRIVING_HOURS - self._shift_driving_hours
            max_window_remaining = MAX_DUTY_WINDOW - self._shift_duty_hours
            max_cycle_remaining = MAX_CYCLE_HOURS - self._cycle_hours_used
            max_fuel_miles = FUEL_INTERVAL_MILES - self._miles_since_fuel

            # Determine effective max driving time
            max_drive_time = min(
                max_drive_before_break,
                max_drive_in_shift,
                max_window_remaining,
                max_cycle_remaining,
                hours_remaining
            )

            # Determine effective max driving distance
            speed = segment_miles / segment_hours if segment_hours > 0 else AVERAGE_SPEED_MPH
            max_drive_miles = min(
                max_drive_time * speed,
                max_fuel_miles,
                miles_remaining
            )

            if max_drive_time <= 0.01 or max_drive_miles <= 0.5:
                # Cannot drive further — determine which limit was hit
                if max_cycle_remaining <= 0.01:
                    logger.info("Cycle limit reached — need 34-hour restart")
                    # Take a 34-hour restart to reset the 70-hour cycle
                    self._take_rest_break('Cycle limit rest', is_cycle_reset=True)
                elif max_drive_in_shift <= 0.01 or max_window_remaining <= 0.01:
                    # Hit 11-hour or 14-hour limit — take mandatory 10-hour rest
                    self._take_rest_break('Shift limit rest')
                elif max_drive_before_break <= 0.01:
                    # Hit 8-hour driving limit — take 30-minute break
                    self._take_30_min_break()
                continue

            # Calculate time for this driving chunk
            drive_time = max_drive_miles / speed if speed > 0 else 0
            drive_time = min(drive_time, max_drive_time)
            drive_miles = drive_time * speed

            # Drive this chunk
            drive_start = self._get_hour_of_day()
            self._add_duty_entry(
                'driving', drive_start, drive_start + drive_time,
                destination_name, 'Driving'
            )
            self._advance_time(drive_time, is_driving=True, is_on_duty=True)
            self._miles_driven += drive_miles
            self._current_day_miles += drive_miles
            self._miles_since_fuel += drive_miles

            miles_remaining -= drive_miles
            hours_remaining -= drive_time

            # Check if we need fuel after this driving chunk
            if self._miles_since_fuel >= FUEL_INTERVAL_MILES - 10 and miles_remaining > 50:
                self._take_fuel_stop()

            # Check if 30-minute break needed
            if self._driving_since_break >= MANDATORY_BREAK_AFTER - 0.01 and miles_remaining > 10:
                self._take_30_min_break()

            # Check if shift limit is approaching
            if (self._shift_driving_hours >= MAX_DRIVING_HOURS - 0.01 or
                    self._shift_duty_hours >= MAX_DUTY_WINDOW - 0.01) and miles_remaining > 10:
                self._take_rest_break('End of shift')

    def _take_30_min_break(self):
        """Insert a mandatory 30-minute break from driving."""
        break_start = self._get_hour_of_day()
        location = self._get_approximate_location()

        self._add_stop('rest', location, self._miles_driven, self._get_total_driving(), MANDATORY_BREAK_DURATION)
        self._add_duty_entry('off_duty', break_start, break_start + MANDATORY_BREAK_DURATION, location, '30-min break')
        self._add_remark(location, '30-minute rest break')
        self._advance_time(MANDATORY_BREAK_DURATION, is_driving=False, is_on_duty=False)
        self._driving_since_break = 0.0

        logger.debug(f"30-min break at {location}")

    def _take_rest_break(self, reason='', is_cycle_reset=False):
        """
        Insert a mandatory rest period.
        
        For 10-hour rest: Standard shift reset
        For 34-hour restart: Resets the 70-hour cycle
        
        IMPORTANT: This method properly handles multi-day rest by:
        1. Filling current day's remaining hours with sleeper
        2. Creating full 24-hour sleeper days as needed
        3. Creating partial sleeper day for remaining hours
        4. Finalizing each day properly before starting the next
        """
        rest_start = self._get_hour_of_day()
        location = self._get_approximate_location()
        
        # Determine rest duration
        rest_duration = 34.0 if is_cycle_reset else MIN_OFF_DUTY_HOURS
        rest_type = '34-hr restart' if is_cycle_reset else '10-hr rest'

        # Add stop marker for the rest
        self._add_stop('sleep', location, self._miles_driven, self._get_total_driving(), rest_duration)
        
        # ─────────────────────────────────────────────────────────────────────
        # STEP 1: Fill current day's remaining hours with sleeper
        # ─────────────────────────────────────────────────────────────────────
        hours_left_in_day = 24.0 - rest_start
        hours_for_today = min(hours_left_in_day, rest_duration)
        
        if hours_for_today > 0.01:
            self._add_duty_entry('sleeper', rest_start, rest_start + hours_for_today, location, reason)
        
        self._finalize_current_day()
        self._current_time += timedelta(hours=hours_for_today)
        rest_duration -= hours_for_today
        
        # ─────────────────────────────────────────────────────────────────────
        # STEP 2: Create full 24-hour sleeper days
        # ─────────────────────────────────────────────────────────────────────
        while rest_duration >= 24.0:
            self._day_start_time = self._current_time
            self._add_duty_entry('sleeper', 0, 24.0, location, f'{reason} (continued)')
            self._finalize_current_day()
            self._current_time += timedelta(hours=24.0)
            rest_duration -= 24.0
        
        # ─────────────────────────────────────────────────────────────────────
        # STEP 3: Handle remaining partial day of rest
        # ─────────────────────────────────────────────────────────────────────
        if rest_duration > 0.01:
            self._day_start_time = self._current_time
            self._add_duty_entry('sleeper', 0, rest_duration, location, f'{reason} (continued)')
            self._current_time += timedelta(hours=rest_duration)
            # DON'T finalize yet - we'll add more entries (pre-trip, driving) to this day
        
        # Add remark
        self._add_remark(location, f'{rest_type} ({reason})')

        # ─────────────────────────────────────────────────────────────────────
        # STEP 4: Reset HOS counters after rest
        # ─────────────────────────────────────────────────────────────────────
        self._shift_driving_hours = 0.0
        self._shift_duty_hours = 0.0
        self._driving_since_break = 0.0
        
        # Reset 70-hour cycle if this is a 34-hour restart
        if is_cycle_reset:
            logger.info(f"34-hour restart complete - cycle hours reset from {self._cycle_hours_used:.1f} to 0")
            self._cycle_hours_used = 0.0

        # ─────────────────────────────────────────────────────────────────────
        # STEP 5: Pre-trip inspection after waking
        # ─────────────────────────────────────────────────────────────────────
        pre_trip_start = self._get_hour_of_day()
        self._add_duty_entry('on_duty', pre_trip_start, pre_trip_start + PRE_TRIP_INSPECTION, location, 'Pre-trip inspection')
        self._advance_time(PRE_TRIP_INSPECTION, is_driving=False, is_on_duty=True)

        logger.debug(f"{rest_type} at {location}: {reason}")

    def _take_fuel_stop(self):
        """Insert a fuel stop (30 minutes on-duty)."""
        fuel_start = self._get_hour_of_day()
        location = self._get_approximate_location()

        self._add_stop('fuel', location, self._miles_driven, self._get_total_driving(), FUEL_STOP_DURATION)
        self._add_duty_entry('on_duty', fuel_start, fuel_start + FUEL_STOP_DURATION, location, 'Fueling')
        self._add_remark(location, 'Fuel stop')
        self._advance_time(FUEL_STOP_DURATION, is_driving=False, is_on_duty=True)
        self._miles_since_fuel = 0.0

        logger.debug(f"Fuel stop at {location}")

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    def _advance_time(self, hours, is_driving=False, is_on_duty=False):
        """Advance the simulation clock and update HOS counters."""
        self._current_time += timedelta(hours=hours)

        if is_driving:
            self._shift_driving_hours += hours
            self._shift_duty_hours += hours
            self._driving_since_break += hours
            self._cycle_hours_used += hours
        elif is_on_duty:
            self._shift_duty_hours += hours
            self._cycle_hours_used += hours
            # Per FMCSA §395.3(a)(3)(ii): 30-min break can be on-duty, off-duty, or sleeper.
            # If an on-duty stop (e.g., fueling) lasts >= 30 min, it satisfies the break requirement.
            if not is_driving and hours >= MANDATORY_BREAK_DURATION - 0.01:
                self._driving_since_break = 0.0

    def _get_hour_of_day(self) -> float:
        """Get current hour of day as float (0.0 - 24.0), rounded to 2 decimals."""
        return round(self._current_time.hour + self._current_time.minute / 60.0 + self._current_time.second / 3600.0, 2)

    def _get_total_driving(self) -> float:
        """Get total driving hours so far in the trip."""
        return self._shift_driving_hours  # Simplified for now

    def _get_approximate_location(self) -> str:
        """
        Get an approximate location name based on miles driven.
        Uses route segments if available, otherwise returns a generic name.
        """
        if self.route_segments:
            # Find the closest segment to our current position
            progress = self._miles_driven / self.total_miles if self.total_miles > 0 else 0
            idx = min(int(progress * len(self.route_segments)), len(self.route_segments) - 1)
            segment = self.route_segments[idx]
            if isinstance(segment, dict) and 'name' in segment:
                return segment['name']
        return f"Mile {self._miles_driven:.0f}"

    def _add_stop(self, stop_type, location_name, miles, driving_hours, duration):
        """Add a stop to the stops list."""
        self._stop_sequence += 1
        stop = StopInfo(
            stop_type=stop_type,
            location_name=location_name,
            latitude=0.0,   # Will be set by route service
            longitude=0.0,  # Will be set by route service
            miles_from_start=miles,
            driving_hours_from_start=driving_hours,
            stop_duration_hours=duration,
            sequence_order=self._stop_sequence
        )
        self._stops.append(stop)

    def _add_duty_entry(self, status, start_hour, end_hour, location, remarks):
        """Add a duty status entry to the current day's log."""
        # Check if we've crossed into a new calendar day
        current_date = self._current_time.date()
        day_start_date = self._day_start_time.date() if hasattr(self._day_start_time, 'date') else self._day_start_time
        
        if current_date > day_start_date and self._current_day_entries:
            # We've crossed midnight - finalize the previous day first
            self._finalize_current_day()
            self._day_start_time = datetime.combine(current_date, datetime.min.time())
        
        # Clamp to 24-hour day
        start_hour = max(0.0, min(24.0, start_hour))
        end_hour = max(start_hour, min(24.0, end_hour))

        if end_hour - start_hour < 0.01:
            return  # Skip negligible entries

        entry = DutyStatusEntry(
            status=status,
            start_hour=round(start_hour, 2),
            end_hour=round(end_hour, 2),
            location=location,
            remarks=remarks
        )
        self._current_day_entries.append(entry)

    def _add_remark(self, location, activity):
        """Add a remark entry for the current day."""
        # Remarks are stored with current day's log during finalization
        pass  # Handled in _finalize_current_day

    def _finalize_current_day(self):
        """
        Finalize the current day's log and start a new day.
        Ensures all 24 hours are accounted for.
        """
        if not self._current_day_entries:
            return

        # Calculate totals for each duty status
        off_duty = 0.0
        sleeper = 0.0
        driving = 0.0
        on_duty = 0.0

        for entry in self._current_day_entries:
            duration = entry.end_hour - entry.start_hour
            if entry.status == 'off_duty':
                off_duty += duration
            elif entry.status == 'sleeper':
                sleeper += duration
            elif entry.status == 'driving':
                driving += duration
            elif entry.status == 'on_duty':
                on_duty += duration

        # Fill remaining hours with off-duty to reach 24
        total_logged = off_duty + sleeper + driving + on_duty
        if total_logged < 23.99:
            remaining = 24.0 - total_logged
            off_duty += remaining
            # Add the off-duty entry to fill the gap
            last_hour = self._current_day_entries[-1].end_hour if self._current_day_entries else 0
            if last_hour < 24.0:
                self._current_day_entries.append(DutyStatusEntry(
                    status='off_duty',
                    start_hour=last_hour,
                    end_hour=24.0,
                    location='',
                    remarks='Off duty'
                ))

        # Build remarks from entries
        remarks = []
        for entry in self._current_day_entries:
            if entry.location and entry.remarks and entry.remarks not in ['Off duty', 'Off Duty', 'Driving']:
                remarks.append({
                    'location': entry.location,
                    'activity': entry.remarks,
                    'time': entry.start_hour
                })

        # Create daily log
        day_number = len(self._daily_logs) + 1
        log_date = self._day_start_time.date() if hasattr(self._day_start_time, 'date') else self._day_start_time

        daily_log = DailyLogData(
            day_number=day_number,
            date=log_date,
            off_duty_hours=round(off_duty, 2),
            sleeper_berth_hours=round(sleeper, 2),
            driving_hours=round(driving, 2),
            on_duty_hours=round(on_duty, 2),
            total_miles_today=round(self._current_day_miles, 1),
            duty_status_entries=self._current_day_entries.copy(),
            remarks=remarks
        )
        self._daily_logs.append(daily_log)

        # Reset for next day
        self._current_day_entries = []
        self._current_day_miles = 0.0
        self._day_start_time = self._current_time

        logger.debug(
            f"Day {day_number}: drive={driving:.1f}h, on_duty={on_duty:.1f}h, "
            f"off={off_duty:.1f}h, sleeper={sleeper:.1f}h, miles={daily_log.total_miles_today:.0f}"
        )

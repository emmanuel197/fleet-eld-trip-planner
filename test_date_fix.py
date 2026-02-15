import sys
sys.path.insert(0, 'backend')

from trip_planner.hos_calculator import HOSCalculator
from datetime import datetime

# Test with 67h cycle - Chicago to Indianapolis to Miami
calc = HOSCalculator(
    current_location='Chicago, IL',
    pickup_location='Indianapolis, IN', 
    dropoff_location='Miami, FL',
    current_cycle_hours=67.5,
    start_time=datetime(2026, 2, 15, 8, 0, 0)
)
stops, logs, final_cycle = calc.calculate()

print('=== DAILY LOGS ===')
for log in logs:
    total = log.off_duty_hours + log.sleeper_berth_hours + log.driving_hours + log.on_duty_hours
    print(f'Day {log.day_number} - {log.date}: off={log.off_duty_hours:.1f}, sleeper={log.sleeper_berth_hours:.1f}, drive={log.driving_hours:.1f}, on_duty={log.on_duty_hours:.1f} | Total={total:.1f}h')

print(f'\nFinal cycle: {final_cycle:.1f}h / 70h')

# Check for duplicate dates
dates = [str(log.date) for log in logs]
print(f'\nDates: {dates}')
if len(dates) != len(set(dates)):
    print('WARNING: Duplicate dates found!')
else:
    print('OK: All dates are unique!')

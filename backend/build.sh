#!/usr/bin/env bash
# Build script for Render deployment
# This runs during the build phase of the Render deploy

set -o errexit  # Exit on error

echo "=== Installing Python dependencies ==="
pip install -r requirements.txt

echo "=== Collecting static files ==="
python manage.py collectstatic --noinput

echo "=== Running database migrations ==="
python manage.py migrate --noinput

echo "=== Build complete ==="

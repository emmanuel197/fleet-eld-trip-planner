"""
WSGI config for eld_project.
Exposes the WSGI callable as a module-level variable named ``application``.
Used by Gunicorn in production (Render deployment).
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eld_project.settings')

application = get_wsgi_application()

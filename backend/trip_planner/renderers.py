"""
Custom DRF renderers for performance optimization.
Uses orjson for faster JSON serialization when available,
falls back to standard json otherwise.
"""

try:
    import orjson
    HAS_ORJSON = True
except ImportError:
    HAS_ORJSON = False
    import json

from rest_framework.renderers import BaseRenderer


class ORJSONRenderer(BaseRenderer):
    """
    Renderer which serializes to JSON using orjson (if available)
    or standard json as a fallback.
    """
    media_type = 'application/json'
    format = 'json'
    charset = None if HAS_ORJSON else 'utf-8'

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if data is None:
            return b''

        if HAS_ORJSON:
            return orjson.dumps(
                data,
                option=orjson.OPT_SERIALIZE_NUMPY | orjson.OPT_UTC_Z
            )
        return json.dumps(data, default=str).encode('utf-8')

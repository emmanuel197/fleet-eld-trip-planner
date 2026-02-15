/**
 * RouteMap Component — Theme-Aware
 * 
 * Renders an interactive Leaflet map showing:
 * - Route polyline (colored gradient: green → blue → red)
 * - Stop markers with colored icons matching stop type
 * - Auto-fits bounds to show entire route
 * 
 * Uses react-leaflet with OpenStreetMap tiles (free, no API key).
 * Supports both dark (CartoDB Dark Matter) and light (CartoDB Positron) tiles.
 *
 * Props:
 *   routeGeometry  - Array of [lat, lng] coordinates for the route line
 *   stops          - Array of stop objects with lat/lng/type/name
 *   height         - Map container height (default: 400)
 *   theme          - 'dark' or 'light' (default: 'dark')
 */

import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Box, Typography, Chip } from '@mui/material';
import { useThemeMode } from '../../theme/ThemeContext';

// ── Stop type → color mapping (matches our design system) ──
const STOP_COLORS = {
  start:   '#3B82F6', // blue
  pickup:  '#F59E0B', // amber
  dropoff: '#EF4444', // red
  fuel:    '#F97316', // orange
  rest:    '#06B6D4', // cyan
  sleep:   '#6366F1', // indigo
};

const STOP_LABELS = {
  start: 'Start', pickup: 'Pickup', dropoff: 'Dropoff',
  fuel: 'Fuel', rest: 'Break', sleep: 'Sleep',
};

// ── Tile layer URLs ──
const TILE_URLS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
};

/**
 * Inner component that auto-fits the map bounds to the route.
 * Must be a child of MapContainer to access the map instance.
 */
function FitBounds({ routeGeometry }) {
  const map = useMap();

  useEffect(() => {
    if (routeGeometry && routeGeometry.length > 1) {
      const bounds = routeGeometry.map(coord => [coord[0], coord[1]]);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [routeGeometry, map]);

  return null;
}

function RouteMap({ routeGeometry = [], stops = [], height = 400 }) {
  // Get theme from context
  const { isDark } = useThemeMode();
  
  // Default center: center of US
  const defaultCenter = [39.8283, -98.5795];
  const defaultZoom = 5;

  // Check if we have valid route data
  const hasRoute = routeGeometry && routeGeometry.length > 1;
  const center = hasRoute
    ? [routeGeometry[Math.floor(routeGeometry.length / 2)][0],
       routeGeometry[Math.floor(routeGeometry.length / 2)][1]]
    : defaultCenter;

  // Theme-aware colors
  const containerBg = isDark ? '#0F172A' : '#F8FAFC';
  const containerBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
  const routeColor = isDark ? '#3B82F6' : '#2563EB';
  const attributionBg = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)';
  const attributionText = isDark ? '#64748B' : '#475569';
  const attributionLink = isDark ? '#94A3B8' : '#3B82F6';

  return (
    <Box
      sx={{
        height,
        borderRadius: '16px',
        overflow: 'hidden',
        border: `1px solid ${containerBorder}`,
        boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
        '& .leaflet-container': {
          height: '100%',
          width: '100%',
          background: containerBg,
        },
        // Style the attribution bar
        '& .leaflet-control-attribution': {
          fontSize: '9px',
          background: `${attributionBg} !important`,
          color: `${attributionText} !important`,
          '& a': { color: `${attributionLink} !important` },
        },
      }}
    >
      <MapContainer
        center={center}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Theme-aware map tiles */}
        <TileLayer
          url={isDark ? TILE_URLS.dark : TILE_URLS.light}
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          className={isDark ? "dark-tiles" : ""}
        />

        {/* Auto-fit bounds to route */}
        {hasRoute && <FitBounds routeGeometry={routeGeometry} />}

        {/* Route polyline */}
        {hasRoute && (
          <Polyline
            positions={routeGeometry}
            pathOptions={{
              color: routeColor,
              weight: 4,
              opacity: 0.85,
              dashArray: null,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {/* Stop markers */}
        {stops.map((stop, index) => {
          if (!stop.latitude || !stop.longitude) return null;
          const color = STOP_COLORS[stop.stop_type] || '#94A3B8';
          const label = STOP_LABELS[stop.stop_type] || stop.stop_type;

          return (
            <CircleMarker
              key={`${stop.stop_type}-${index}`}
              center={[stop.latitude, stop.longitude]}
              radius={stop.stop_type === 'start' || stop.stop_type === 'dropoff' ? 8 : 6}
              pathOptions={{
                color: isDark ? '#FFFFFF' : '#1E293B',
                fillColor: color,
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <Box sx={{ p: 0.5, minWidth: 140 }}>
                  <Chip
                    label={label}
                    size="small"
                    sx={{
                      bgcolor: color,
                      color: '#FFF',
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      height: 20,
                      mb: 0.5,
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1E293B' }}>
                    {stop.location_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                    Mile {Math.round(stop.miles_from_start)} · {stop.stop_duration_hours}h stop
                  </Typography>
                </Box>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </Box>
  );
}

export default RouteMap;

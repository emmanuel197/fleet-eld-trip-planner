/**
 * TripResultPage — Theme-Aware Design (Light + Dark)
 * 
 * Displays trip planning results:
 * - Glass hero summary card with KPI stats
 * - Interactive Leaflet map with route + stop markers
 * - Color-coded stops list
 * - Daily ELD log cards with FMCSA-standard SVG grids + Remarks
 * 
 * Data flows: URL param tripId → GET /api/trip/:id → render
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Alert, Chip,
  Stack, AppBar, Toolbar, Skeleton, Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RouteIcon from '@mui/icons-material/Route';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { getTripDetail } from '../services/api';
import Crosshatch from '../components/ui/Crosshatch';
import RouteMap from '../components/map/RouteMap';
import ELDLogGrid from '../components/logs/ELDLogGrid';
import ThemeToggle from '../components/ThemeToggle';
import { useThemeMode } from '../theme/ThemeContext';

// ── Stop badge styles (theme-aware via function) ──
const getStopStyles = (isDark) => ({
  start:   { bg: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.1)',  color: isDark ? '#60A5FA' : '#2563EB', border: isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.3)',  label: 'Start' },
  pickup:  { bg: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.1)',  color: isDark ? '#FBBF24' : '#D97706', border: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.3)',  label: 'Pickup' },
  dropoff: { bg: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.1)',   color: isDark ? '#FCA5A5' : '#DC2626', border: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.3)',   label: 'Dropoff' },
  fuel:    { bg: isDark ? 'rgba(249,115,22,0.12)' : 'rgba(249,115,22,0.1)',  color: isDark ? '#FB923C' : '#EA580C', border: isDark ? 'rgba(249,115,22,0.3)' : 'rgba(249,115,22,0.3)',  label: 'Fuel' },
  rest:    { bg: isDark ? 'rgba(6,182,212,0.12)' : 'rgba(6,182,212,0.1)',   color: isDark ? '#67E8F9' : '#0891B2', border: isDark ? 'rgba(6,182,212,0.3)' : 'rgba(6,182,212,0.3)',   label: 'Break' },
  sleep:   { bg: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.1)',  color: isDark ? '#A5B4FC' : '#4F46E5', border: isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.3)',  label: 'Sleep' },
});

// ── ELD status colors (same for both themes - good contrast) ──
const ELD_COLORS = {
  off_duty_hours: '#94A3B8',
  sleeper_berth_hours: '#818CF8',
  driving_hours: '#10B981',
  on_duty_hours: '#F59E0B',
};


import PrintLayout from '../components/logs/PrintLayout';

function TripResultPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { isDark } = useThemeMode();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Print Handler ───
  const handlePrint = () => {
    window.print();
  };

  // ─── Theme-aware color tokens ───
  const colors = {
    // Backgrounds
    pageBg: isDark 
      ? 'linear-gradient(180deg, #0A0F1C 0%, #111827 50%, #0F172A 100%)'
      : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 50%, #F1F5F9 100%)',
    cardBg: isDark 
      ? 'rgba(30,41,59,0.5)' 
      : 'rgba(255,255,255,0.95)',
    cardBorder: isDark 
      ? 'rgba(255,255,255,0.05)' 
      : 'rgba(226,232,240,1)',
    cardShadow: isDark
      ? 'none'
      : '0 4px 24px rgba(0,0,0,0.06)',
    heroBg: isDark 
      ? 'rgba(255,255,255,0.05)' 
      : 'rgba(255,255,255,0.95)',
    heroBorder: isDark 
      ? 'rgba(255,255,255,0.08)' 
      : 'rgba(226,232,240,1)',
    statBg: isDark 
      ? 'rgba(255,255,255,0.04)' 
      : 'rgba(248,250,252,1)',
    statBorder: isDark 
      ? 'rgba(255,255,255,0.06)' 
      : 'rgba(226,232,240,1)',
    // Text
    textPrimary: isDark ? '#FFFFFF' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#64748B',
    textAccent: isDark ? '#FBBF24' : '#D97706',
    // Navbar
    navbarBg: isDark 
      ? 'rgba(15,23,42,0.8)' 
      : 'rgba(255,255,255,0.9)',
    navbarBorder: isDark 
      ? 'rgba(255,255,255,0.08)' 
      : 'rgba(226,232,240,0.8)',
    navLogoBg: isDark 
      ? 'rgba(255,255,255,0.1)' 
      : 'rgba(59,130,246,0.1)',
    navLogoColor: isDark ? '#FFF' : '#3B82F6',
    // Buttons
    btnBg: isDark 
      ? 'rgba(255,255,255,0.05)' 
      : 'rgba(241,245,249,1)',
    btnBorder: isDark 
      ? 'rgba(255,255,255,0.1)' 
      : 'rgba(226,232,240,1)',
    btnText: isDark ? '#CBD5E1' : '#475569',
    // Stop rows
    stopRowBg: isDark 
      ? 'rgba(255,255,255,0.02)' 
      : 'rgba(248,250,252,0.8)',
    // Log card
    logCardBg: isDark 
      ? 'rgba(15,23,42,0.5)' 
      : 'rgba(248,250,252,1)',
    // Ambient
    orbOpacity: isDark ? 1 : 0.3,
  };

  // Get stop styles for current theme
  const STOP_STYLES = getStopStyles(isDark);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const data = await getTripDetail(tripId);
        setTrip(data);
      } catch (err) {
        setError('Failed to load trip details. The trip may not exist.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [tripId]);


  // ── Loading skeleton ──
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', background: colors.pageBg, p: 4 }}>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', mb: 3 }} />
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Skeleton variant="rectangular" height={400} sx={{ flex: 2, borderRadius: 4, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
          <Skeleton variant="rectangular" height={400} sx={{ flex: 1, borderRadius: 4, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
        </Box>
      </Box>
    );
  }

  // ── Error state ──
  if (error || !trip) {
    return (
      <Box sx={{ minHeight: '100vh', background: colors.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ maxWidth: 500, textAlign: 'center', p: 4 }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error || 'Trip not found.'}</Alert>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}
            sx={{ color: colors.textSecondary, borderColor: colors.cardBorder, '&:hover': { bgcolor: colors.statBg } }}
            variant="outlined">
            Back to Planner
          </Button>
        </Box>
      </Box>
    );
  }

  // ── Card sx helper ──
  const cardSx = {
    bgcolor: colors.cardBg,
    borderRadius: '16px',
    border: `1px solid ${colors.cardBorder}`,
    boxShadow: colors.cardShadow,
    p: { xs: 2.5, sm: 3 },
  };


  return (
    <>
      <Box className="no-print" sx={{
        minHeight: '100vh', color: colors.textPrimary, position: 'relative', overflow: 'hidden',
        background: colors.pageBg,
      }}>
        {/* Ambient orbs */}
        <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', opacity: colors.orbOpacity }}>
          <Box sx={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 60%)' }} />
          <Box sx={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 60%)' }} />
          <Box sx={{ position: 'absolute', top: '40%', left: '30%', width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 60%)' }} />
        </Box>

        {/* Crosshatch texture */}
        <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
          <Crosshatch color={isDark ? 'white' : 'black'} opacity={isDark ? 0.03 : 0.02} />
        </Box>

        {/* Navbar */}
        <AppBar position="sticky" sx={{ 
          zIndex: 20,
          bgcolor: colors.navbarBg,
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${colors.navbarBorder}`,
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: '52px !important' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 36, height: 36, borderRadius: '12px', bgcolor: colors.navLogoBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LocalShippingIcon sx={{ fontSize: 18, color: colors.navLogoColor }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: colors.textPrimary, lineHeight: 1.2 }}>Fleet ELD</Typography>
                <Typography sx={{ fontSize: '0.6rem', color: colors.textMuted, lineHeight: 1 }}>Trip Results</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <ThemeToggle size="small" />
              <Button startIcon={<PictureAsPdfIcon />} onClick={handlePrint}
                sx={{ color: colors.btnText, fontSize: '0.75rem', fontWeight: 600,
                  bgcolor: colors.btnBg, borderRadius: '9999px', px: 2, py: 0.75,
                  border: `1px solid ${colors.btnBorder}`,
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(241,245,249,1)', borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' } }}>
                Export PDF
              </Button>
              <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}
                sx={{ color: colors.btnText, fontSize: '0.75rem', fontWeight: 600,
                  bgcolor: colors.btnBg, borderRadius: '9999px', px: 2, py: 0.75,
                  border: `1px solid ${colors.btnBorder}`,
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(241,245,249,1)', borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' } }}>
                New Trip
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>


        {/* ── Content ── */}
        <Box sx={{ position: 'relative', zIndex: 10, maxWidth: 1440, mx: 'auto', px: { xs: 2, sm: 4, md: 6, lg: 8 }, pt: 4, pb: 10 }}>

          {/* ═══ Glass Hero Summary ═══ */}
          <Box sx={{
            borderRadius: '20px', p: { xs: 3, sm: 4 }, mb: 4,
            background: colors.heroBg,
            backdropFilter: isDark ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
            border: `1px solid ${colors.heroBorder}`,
            boxShadow: colors.cardShadow,
          }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: colors.textAccent,
              textTransform: 'uppercase', letterSpacing: '0.1em' }}>Trip Summary</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, mt: 0.5, mb: 3 }}>
              {trip.current_location} → {trip.pickup_location} → {trip.dropoff_location}
            </Typography>

            {/* KPI Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { val: Math.round(trip.total_distance_miles), unit: 'mi', label: 'Distance', icon: <RouteIcon sx={{ fontSize: 15 }} />, c: '#3B82F6' },
                { val: trip.total_duration_hours?.toFixed(1), unit: 'hrs', label: 'Drive Time', icon: <AccessTimeIcon sx={{ fontSize: 15 }} />, c: '#F59E0B' },
                { val: trip.total_trip_days, unit: trip.total_trip_days === 1 ? 'day' : 'days', label: 'Duration', icon: <NightsStayIcon sx={{ fontSize: 15 }} />, c: '#8B5CF6' },
                { val: trip.stops?.filter(s => s.stop_type === 'fuel').length || 0, unit: 'stops', label: 'Fuel', icon: <LocalGasStationIcon sx={{ fontSize: 15 }} />, c: '#EF4444' },
              ].map((stat) => (
                <Grid item xs={6} sm={3} key={stat.label}>
                  <Box sx={{ borderRadius: '12px', p: 2,
                    bgcolor: colors.statBg, border: `1px solid ${colors.statBorder}` }}>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: colors.textMuted, mb: 1 }}>
                      <Box sx={{ color: isDark ? colors.textMuted : stat.c }}>{stat.icon}</Box>
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {stat.label}
                      </Typography>
                    </Stack>
                    <Typography component="span" sx={{ fontSize: '1.5rem', fontWeight: 800, color: isDark ? '#FFF' : stat.c }}>
                      {stat.val}
                    </Typography>
                    <Typography component="span" sx={{ fontSize: '0.7rem', color: colors.textMuted, ml: 0.5 }}>
                      {stat.unit}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Cycle progress bar */}
            {(() => {
              const cycleAfterTrip = trip.current_cycle_used + (trip.total_duration_hours || 0);
              const cyclePercent = Math.min((cycleAfterTrip / 70) * 100, 100);
              // Severity-based color: green (safe) → amber (warning) → red (critical)
              const cycleColor = cycleAfterTrip > 55 ? '#EF4444' : cycleAfterTrip > 35 ? '#F59E0B' : '#10B981';
              return (
                <Box sx={{ borderRadius: '12px', p: 2, bgcolor: colors.statBg, border: `1px solid ${colors.statBorder}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: colors.textMuted,
                      textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cycle After Trip</Typography>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: cycleColor }}>
                      {cycleAfterTrip.toFixed(1)}h / 70h
                    </Typography>
                  </Box>
                  <Box sx={{ height: 8, bgcolor: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.25)', borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', borderRadius: 4, transition: 'all 0.3s ease',
                      width: `${cyclePercent}%`,
                      bgcolor: cycleColor }} />
                  </Box>
                </Box>
              );
            })()}
          </Box>


          {/* ═══ Top Section: Map + Stops side by side ═══ */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, mb: 4 }}>

            {/* ── Left: Map (60%) ── */}
            <Box sx={{ flex: 1.5, minWidth: 0 }}>
              <RouteMap
                routeGeometry={trip.route_geometry || []}
                stops={trip.stops || []}
                height={420}
              />
            </Box>

            {/* ── Right: Stops list (40%) ── */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ ...cardSx, height: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RouteIcon sx={{ fontSize: 16, color: colors.textMuted }} /> Route Stops
                  </Typography>
                  <Typography sx={{ fontSize: '0.6rem', color: colors.textMuted }}>
                    {trip.stops?.length || 0} stops
                  </Typography>
                </Stack>

                <Stack spacing={0.5} sx={{ maxHeight: 350, overflowY: 'auto' }}>
                  {trip.stops?.map((stop, i) => {
                    const st = STOP_STYLES[stop.stop_type] || STOP_STYLES.rest;
                    return (
                      <Box key={i} sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1.25, borderRadius: '10px',
                        bgcolor: i % 2 === 0 ? colors.stopRowBg : 'transparent',
                      }}>
                        <Chip label={st.label} size="small" sx={{
                          bgcolor: st.bg, color: st.color, fontWeight: 700, fontSize: '0.6rem',
                          border: `1px solid ${st.border}`, minWidth: 56, height: 22,
                        }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textPrimary }} noWrap>
                            {stop.location_name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.6rem', color: colors.textMuted }}>
                            Mile {Math.round(stop.miles_from_start)} · {stop.stop_duration_hours}h stop
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </Box>
          </Box>


          {/* ═══ Bottom Section: Daily ELD Logs (FULL WIDTH) ═══ */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <DescriptionIcon sx={{ fontSize: 20, color: colors.textAccent }} /> 
                Driver's Daily Logs
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontSize: '0.7rem', color: colors.textMuted, bgcolor: colors.statBg, px: 1.5, py: 0.5, borderRadius: 2 }}>
                  {trip.daily_logs?.length || 0} days · FMCSA § 395.8 Compliant
                </Typography>
              </Stack>
            </Stack>

            <Grid container spacing={3}>
              {trip.daily_logs?.map((log) => (
                <Grid item xs={12} lg={6} key={log.day_number}>
                  <Box sx={{
                    ...cardSx,
                    bgcolor: colors.cardBg,
                  }}>
                    {/* ── Log Header ── */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 2, borderBottom: `1px solid ${colors.statBorder}` }}>
                      <Box>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: colors.textPrimary }}>
                          Day {log.day_number} — {log.date}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: colors.textMuted }}>
                          {log.total_miles_today?.toFixed(0)} miles driven
                        </Typography>
                      </Box>
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: '12px !important' }} />}
                        label="24h Total"
                        size="small"
                        sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 700,
                          fontSize: '0.65rem', border: '1px solid rgba(16,185,129,0.2)', height: 24,
                          '& .MuiChip-icon': { color: '#10B981' } }}
                      />
                    </Box>

                    {/* ── FMCSA Log Grid (LARGER) ── */}
                    <Box sx={{ mb: 2 }}>
                      <ELDLogGrid log={log} compact={false} theme={isDark ? 'dark' : 'light'} />
                    </Box>

                    {/* ── Remarks Section (FMCSA Required) ── */}
                    <Box sx={{ mb: 2, p: 2, bgcolor: colors.statBg, borderRadius: 2, border: `1px solid ${colors.statBorder}` }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
                        Remarks — Location & Activity
                      </Typography>
                      <Stack spacing={0.5}>
                        {log.duty_status_entries?.map((entry, i) => {
                          const statusLabels = { off_duty: 'Off Duty', sleeper: 'Sleeper', driving: 'Driving', on_duty: 'On Duty' };
                          const statusColors = { off_duty: '#94A3B8', sleeper: '#818CF8', driving: '#10B981', on_duty: '#F59E0B' };
                          const formatTime = (h) => {
                            const hours = Math.floor(h);
                            const mins = Math.round((h - hours) * 60);
                            const period = hours >= 12 ? 'PM' : 'AM';
                            const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                            return `${displayHour}:${mins.toString().padStart(2, '0')} ${period}`;
                          };
                          return (
                            <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', fontSize: '0.7rem' }}>
                              <Typography sx={{ fontSize: '0.65rem', color: colors.textMuted, minWidth: 55 }}>
                                {formatTime(entry.start_hour)}
                              </Typography>
                              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: statusColors[entry.status], minWidth: 60 }}>
                                {statusLabels[entry.status]}
                              </Typography>
                              <Typography sx={{ fontSize: '0.65rem', color: colors.textSecondary, flex: 1 }}>
                                {entry.location || entry.activity || '—'}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>

                    {/* ── Hour Totals ── */}
                    <Grid container spacing={1}>
                      {[
                        { label: 'Off Duty', key: 'off_duty_hours', color: '#94A3B8' },
                        { label: 'Sleeper Berth', key: 'sleeper_berth_hours', color: '#818CF8' },
                        { label: 'Driving', key: 'driving_hours', color: '#10B981' },
                        { label: 'On Duty (Not Driving)', key: 'on_duty_hours', color: '#F59E0B' },
                      ].map((h) => (
                        <Grid item xs={6} sm={3} key={h.key}>
                          <Box sx={{ textAlign: 'center', p: 1, borderRadius: '8px',
                            bgcolor: colors.logCardBg, border: `1px solid ${h.color}30` }}>
                            <Typography sx={{ fontSize: '0.55rem', color: colors.textMuted, mb: 0.25 }}>{h.label}</Typography>
                            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: h.color }}>
                              {log[h.key]?.toFixed(1) || '0'}h
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Box>

      {/* ── Print Layout (Visible only on print) ── */}
      <PrintLayout trip={trip} />
    </>
  );
}

export default TripResultPage;

/**
 * TripPlannerPage — Theme-Aware Design (Light + Dark)
 * 
 * Main form page where users input trip details.
 * Supports both dark immersive mode and clean light mode.
 * Layout: Horizontal flex — hero content left, form card right
 * 
 * Inputs: Current location, Pickup, Dropoff, Cycle hours used
 * Action: Submits to POST /api/plan-trip/ → navigates to results
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Slider, Alert,
  CircularProgress, InputAdornment, Chip, Stack, AppBar,
  Toolbar, LinearProgress, useTheme,
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PlaceIcon from '@mui/icons-material/Place';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RouteIcon from '@mui/icons-material/Route';
import DescriptionIcon from '@mui/icons-material/Description';
import ShieldIcon from '@mui/icons-material/Shield';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BoltIcon from '@mui/icons-material/Bolt';
import { planTrip } from '../services/api';
import Crosshatch from '../components/ui/Crosshatch';
import ThemeToggle from '../components/ThemeToggle';
import { useThemeMode } from '../theme/ThemeContext';

function TripPlannerPage() {
  const navigate = useNavigate();
  const { isDark } = useThemeMode();
  const theme = useTheme();

  // ─── Theme-aware color tokens ───
  const colors = {
    // Backgrounds
    pageBg: isDark 
      ? 'linear-gradient(180deg, #080C18 0%, #0F172A 50%, #0F172A 100%)'
      : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 50%, #F1F5F9 100%)',
    cardBg: isDark 
      ? 'rgba(255,255,255,0.06)' 
      : 'rgba(255,255,255,0.95)',
    cardBorder: isDark 
      ? 'rgba(255,255,255,0.1)' 
      : 'rgba(226,232,240,1)',
    cardShadow: isDark
      ? '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)'
      : '0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    inputBg: isDark 
      ? 'rgba(255,255,255,0.05)' 
      : '#F8FAFC',
    inputBgHover: isDark 
      ? 'rgba(255,255,255,0.08)' 
      : '#F1F5F9',
    inputBorder: isDark 
      ? 'rgba(255,255,255,0.08)' 
      : '#E2E8F0',
    inputBorderHover: isDark 
      ? 'rgba(255,255,255,0.15)' 
      : '#CBD5E1',
    inputBorderFocus: isDark 
      ? 'rgba(255,255,255,0.25)' 
      : '#3B82F6',
    // Text
    textPrimary: isDark ? '#FFFFFF' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#64748B',
    textSubtle: isDark ? 'rgba(255,255,255,0.7)' : '#475569',
    // Feature cards
    featureCardBg: isDark 
      ? 'rgba(255,255,255,0.05)' 
      : 'rgba(255,255,255,0.9)',
    featureCardBorder: isDark 
      ? 'rgba(255,255,255,0.07)' 
      : 'rgba(226,232,240,0.8)',
    featureIconBg: isDark 
      ? 'rgba(255,255,255,0.08)' 
      : 'rgba(59,130,246,0.1)',
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
    // Chip badges
    chipBg: isDark 
      ? 'rgba(255,255,255,0.08)' 
      : 'rgba(59,130,246,0.08)',
    chipBorder: isDark 
      ? 'rgba(255,255,255,0.12)' 
      : 'rgba(59,130,246,0.2)',
    chipText: isDark 
      ? 'rgba(255,255,255,0.7)' 
      : '#3B82F6',
    // Assumption chips
    assumptionBg: isDark 
      ? 'rgba(255,255,255,0.04)' 
      : 'rgba(241,245,249,1)',
    assumptionBorder: isDark 
      ? 'rgba(255,255,255,0.06)' 
      : 'rgba(226,232,240,1)',
    // Slider section
    sliderSectionBg: isDark 
      ? 'rgba(255,255,255,0.04)' 
      : 'rgba(248,250,252,1)',
    sliderSectionBorder: isDark 
      ? 'rgba(255,255,255,0.06)' 
      : 'rgba(226,232,240,1)',
    // Ambient orbs (reduced in light mode)
    orbOpacity: isDark ? 1 : 0.4,
  };

  // Form state
  const [formData, setFormData] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_used: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    setError(null);
  };

  const handleCycleChange = (event, newValue) => {
    setFormData((prev) => ({ ...prev, current_cycle_used: newValue }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.current_location || !formData.pickup_location || !formData.dropoff_location) {
      setError('Please fill in all location fields.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await planTrip(formData);
      navigate(`/trip/${result.id}`);
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.errors ||
        'Failed to plan trip. Please check your inputs and try again.';
      setError(typeof message === 'string' ? message : JSON.stringify(message));
    } finally {
      setLoading(false);
    }
  };

  // Cycle slider color thresholds
  const cycleColor = formData.current_cycle_used > 55 ? '#EF4444'
    : formData.current_cycle_used > 35 ? '#F59E0B' : '#10B981';
  const cyclePercent = (formData.current_cycle_used / 70) * 100;

  // Theme-aware input styles
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      backgroundColor: colors.inputBg,
      color: colors.textPrimary,
      transition: 'all 0.2s',
      '& fieldset': { borderColor: colors.inputBorder },
      '&:hover fieldset': { borderColor: colors.inputBorderHover },
      '&.Mui-focused fieldset': { borderColor: colors.inputBorderFocus, borderWidth: isDark ? 1 : 2 },
      '&.Mui-focused': { backgroundColor: colors.inputBgHover },
    },
    '& .MuiInputLabel-root': { color: colors.textSecondary, fontSize: '0.8rem', fontWeight: 600 },
    '& .MuiInputLabel-root.Mui-focused': { color: isDark ? '#F8FAFC' : '#3B82F6' },
    '& input::placeholder': { color: colors.textMuted },
    '& input': { color: colors.textPrimary },
  };


  return (
    <Box sx={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      background: colors.pageBg,
    }}>
      {/* Crosshatch texture */}
      <Crosshatch color={isDark ? 'white' : 'black'} opacity={isDark ? 0.045 : 0.025} />

      {/* Ambient gradient orbs */}
      <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: colors.orbOpacity }}>
        <Box sx={{ position: 'absolute', top: '-15%', right: '5%', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 60%)' }} />
        <Box sx={{ position: 'absolute', bottom: '-5%', left: '10%', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 60%)' }} />
        <Box sx={{ position: 'absolute', top: '50%', left: '40%', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 60%)' }} />
      </Box>

      {/* Decorative circles */}
      <Box sx={{ position: 'absolute', top: '8%', right: '6%', width: 220, height: 220, borderRadius: '50%',
        background: isDark ? 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(59,130,246,0.08)'}`, zIndex: 0, opacity: colors.orbOpacity }} />
      <Box sx={{ position: 'absolute', top: '12%', right: '8%', width: 160, height: 160, borderRadius: '50%',
        background: isDark ? 'radial-gradient(circle, rgba(245,158,11,0.03) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(245,158,11,0.08)'}`, zIndex: 0, opacity: colors.orbOpacity }} />
      
      <Box sx={{ position: 'absolute', bottom: '10%', left: '3%', width: 280, height: 280, borderRadius: '50%',
        background: isDark ? 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(16,185,129,0.08)'}`, zIndex: 0, opacity: colors.orbOpacity }} />

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
              <Typography sx={{ fontSize: '0.6rem', color: colors.textMuted, lineHeight: 1 }}>Trip Planner</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              icon={<ShieldIcon sx={{ fontSize: '12px !important' }} />}
              label="FMCSA Compliant"
              size="small"
              sx={{ 
                display: { xs: 'none', sm: 'inline-flex' }, // Hide on mobile
                bgcolor: 'rgba(16,185,129,0.1)', color: '#34D399', fontWeight: 700,
                fontSize: '0.65rem', border: '1px solid rgba(16,185,129,0.2)',
                '& .MuiChip-icon': { color: '#34D399' } 
              }}
            />
            <ThemeToggle size="small" />
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Loading bar */}
      {loading && <LinearProgress sx={{ position: 'fixed', top: 52, left: 0, right: 0, zIndex: 30 }} />}


      {/* ── Main content: horizontal flex ── */}
      <Box sx={{ position: 'relative', zIndex: 10, maxWidth: 1440, mx: 'auto', px: { xs: 3, sm: 4, md: 6, lg: 8 }, py: { xs: 4, md: 8 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: 'center', gap: { xs: 5, lg: 8 } }}>

          {/* ── LEFT: Hero content ── */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Chip
              icon={<BoltIcon sx={{ fontSize: '12px !important' }} />}
              label="ELD Trip Planning Engine"
              size="small"
              sx={{ mb: 3, bgcolor: colors.chipBg, color: colors.chipText, fontWeight: 700,
                fontSize: '0.68rem', border: `1px solid ${colors.chipBorder}`,
                '& .MuiChip-icon': { color: colors.chipText } }}
            />

            <Typography sx={{ fontSize: { xs: '2.5rem', sm: '3.2rem' }, fontWeight: 800, color: colors.textPrimary,
              letterSpacing: '-0.02em', lineHeight: 1.05, mb: 2.5 }}>
              Plan Your{' '}
              <Box component="span" sx={{ color: colors.textSubtle }}>Trip</Box>
            </Typography>

            <Typography sx={{ color: colors.textSecondary, fontSize: '1.05rem', lineHeight: 1.6, mb: 5, maxWidth: 440 }}>
              HOS-compliant scheduling with automated ELD log sheet generation. Built for property-carrying drivers on the 70-hour/8-day cycle.
            </Typography>

            {/* Feature cards — horizontal flex */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 4 }}>
              {[
                { icon: <RouteIcon sx={{ fontSize: 20 }} />, label: 'Smart Routing', desc: 'Fuel & rest stops', c: '#3B82F6' },
                { icon: <AccessTimeIcon sx={{ fontSize: 20 }} />, label: 'HOS Engine', desc: '11hr / 14hr tracked', c: '#F59E0B' },
                { icon: <DescriptionIcon sx={{ fontSize: 20 }} />, label: 'ELD Logs', desc: 'FMCSA format', c: '#10B981' },
              ].map((f) => (
                <Box key={f.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5,
                  bgcolor: colors.featureCardBg, backdropFilter: isDark ? 'blur(8px)' : 'none',
                  borderRadius: '12px', px: 2, py: 1.5, border: `1px solid ${colors.featureCardBorder}`, flex: 1,
                  boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', bgcolor: isDark ? 'rgba(255,255,255,0.08)' : `${f.c}15`, color: isDark ? '#FFF' : f.c }}>
                    {f.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textPrimary }}>{f.label}</Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: colors.textMuted }}>{f.desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>

            {/* HOS stat numbers */}
            <Stack direction="row" spacing={4} sx={{ mb: 3 }}>
              {[
                { val: '11h', label: 'Drive Limit', c: isDark ? 'rgba(255,255,255,0.7)' : '#3B82F6' },
                { val: '14h', label: 'Duty Window', c: isDark ? 'rgba(255,255,255,0.8)' : '#F59E0B' },
                { val: '70h', label: 'Cycle Cap', c: isDark ? 'rgba(255,255,255,0.9)' : '#10B981' },
              ].map((s) => (
                <Box key={s.label}>
                  <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: s.c }}>{s.val}</Typography>
                  <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: colors.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</Typography>
                </Box>
              ))}
            </Stack>

            {/* Assumption chips */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {['70hr / 8-day', 'Property Carrier', 'No Adverse Conditions'].map((c) => (
                <Chip key={c} label={c} size="small" sx={{ fontSize: '0.6rem', fontWeight: 600,
                  color: colors.textMuted, bgcolor: colors.assumptionBg, border: `1px solid ${colors.assumptionBorder}` }} />
              ))}
            </Stack>
          </Box>


          {/* ── RIGHT: Glass form card ── */}
          <Box sx={{ width: { xs: '100%', lg: 430 }, flexShrink: 0 }}>
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                borderRadius: '20px', p: { xs: 3, sm: 3.5 },
                position: 'relative', overflow: 'hidden',
                background: colors.cardBg,
                backdropFilter: isDark ? 'blur(24px)' : 'none',
                WebkitBackdropFilter: isDark ? 'blur(24px)' : 'none',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: colors.cardShadow,
              }}
            >

              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: colors.textPrimary, mb: 2.5, mt: 0.5 }}>
                Enter Trip Details
              </Typography>

              <Stack spacing={2}>
                {/* Location fields */}
                <TextField
                  fullWidth label="Current Location"
                  placeholder="e.g., Chicago, IL"
                  value={formData.current_location}
                  onChange={handleChange('current_location')}
                  required
                  sx={inputSx}
                  InputProps={{ startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ width: 28, height: 28, borderRadius: '8px', 
                        bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(59,130,246,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MyLocationIcon sx={{ fontSize: 15, color: isDark ? '#FFF' : '#3B82F6' }} />
                      </Box>
                    </InputAdornment>
                  )}}
                />
                <TextField
                  fullWidth label="Pickup Location"
                  placeholder="e.g., Indianapolis, IN"
                  value={formData.pickup_location}
                  onChange={handleChange('pickup_location')}
                  required
                  sx={inputSx}
                  InputProps={{ startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ width: 28, height: 28, borderRadius: '8px', 
                        bgcolor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(245,158,11,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LocalShippingIcon sx={{ fontSize: 15, color: isDark ? '#FFF' : '#F59E0B' }} />
                      </Box>
                    </InputAdornment>
                  )}}
                />
                <TextField
                  fullWidth label="Dropoff Location"
                  placeholder="e.g., Miami, FL"
                  value={formData.dropoff_location}
                  onChange={handleChange('dropoff_location')}
                  required
                  sx={inputSx}
                  InputProps={{ startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ width: 28, height: 28, borderRadius: '8px', 
                        bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PlaceIcon sx={{ fontSize: 15, color: isDark ? '#FFF' : '#EF4444' }} />
                      </Box>
                    </InputAdornment>
                  )}}
                />


                {/* Cycle slider */}
                <Box sx={{ bgcolor: colors.sliderSectionBg, borderRadius: '12px', p: 2,
                  border: `1px solid ${colors.sliderSectionBorder}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: colors.textSecondary,
                      textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeIcon sx={{ fontSize: 12 }} /> Cycle Used
                    </Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: cycleColor }}>
                      {formData.current_cycle_used}h
                      <Box component="span" sx={{ fontSize: '0.6rem', fontWeight: 400, color: colors.textMuted, ml: 0.5 }}>/ 70h</Box>
                    </Typography>
                  </Box>
                  {/* Visual progress bar */}
                  <Box sx={{ height: 8, bgcolor: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.2)', borderRadius: 4, overflow: 'hidden', mb: 0.5 }}>
                    <Box sx={{ height: '100%', borderRadius: 4, transition: 'all 0.2s',
                      width: `${cyclePercent}%`, bgcolor: cycleColor }} />
                  </Box>
                  <Slider
                    value={formData.current_cycle_used}
                    onChange={handleCycleChange}
                    min={0} max={70} step={0.5}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `${v}h`}
                    sx={{ color: cycleColor, height: 4, mt: 0.5,
                      '& .MuiSlider-thumb': { width: 16, height: 16, bgcolor: cycleColor },
                      '& .MuiSlider-rail': { bgcolor: isDark ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.3)' } }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -0.5 }}>
                    <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: colors.textMuted }}>0h</Typography>
                    <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: colors.textMuted }}>35h</Typography>
                    <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: colors.textMuted }}>70h</Typography>
                  </Box>
                </Box>

                {/* Error display */}
                {error && <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: '12px' }}>{error}</Alert>}

                {/* Submit — pill button */}
                <Button
                  type="submit" variant="contained" fullWidth disabled={loading}
                  sx={{
                    py: 1.75, borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 700,
                    color: '#FFFFFF',
                    backgroundImage: isDark 
                      ? 'linear-gradient(135deg, #3B5A8A 0%, #4A6A9A 60%, #5A7AAA 100%)'
                      : 'linear-gradient(135deg, #1E40AF 0%, #2563EB 60%, #3B82F6 100%)',
                    '&:hover': {
                      backgroundImage: isDark
                        ? 'linear-gradient(135deg, #4A6A9A 0%, #5A7AAA 50%, #6A8ABA 100%)'
                        : 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #60A5FA 100%)',
                      boxShadow: isDark 
                        ? '0 8px 24px rgba(59,90,138,0.4)'
                        : '0 8px 24px rgba(37,99,235,0.35)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                  startIcon={loading ? <CircularProgress size={18} sx={{ color: '#FFF' }} /> : <RouteIcon />}
                  endIcon={!loading && <ChevronRightIcon />}
                >
                  {loading ? 'Planning Route...' : 'Plan Trip & Generate Logs'}
                </Button>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default TripPlannerPage;

/**
 * Material UI Theme Configuration — Fleet ELD Trip Planner
 * 
 * Design System v4 (Final) - Dual Theme Support
 * 
 * Design philosophy:
 * - Dark Mode: Immersive with crosshatch texture, glassmorphism
 * - Light Mode: Clean, professional with subtle depth
 * - Both: Pill buttons, consistent typography, FMCSA ELD colors
 * 
 * Token scales: color, typography, spacing, shadows, radius
 * Based on design research: Flux Academy, Toptal, IxDF, UXPin
 */

import { createTheme, alpha } from '@mui/material/styles';

// =============================================================================
// SHARED DESIGN TOKENS (used by both themes)
// =============================================================================

const sharedTokens = {
  // ── ELD Status Colors (Industry Standard — matches Samsara) ──
  eld: {
    offDuty:   '#94A3B8',  // Slate-400 — off duty line
    sleeper:   '#818CF8',  // Indigo-400 — sleeper berth
    driving:   '#34D399',  // Emerald-400 — driving
    onDuty:    '#FBBF24',  // Amber-400 — on duty (not driving)
  },

  // ── Border Radius Scale ──
  radius: {
    sm:   8,    // inputs, badges, buttons
    md:   12,   // standard cards, dropdowns
    lg:   16,   // large cards, map container
    xl:   20,   // hero card, glass panels
    full: 9999, // pill buttons, round badges
  },

  // ── Spacing Scale (8px base) ──
  spacing: {
    xs:  4,     // 0.25rem — tight badge padding
    sm:  8,     // 0.5rem  — icon gaps
    md:  12,    // 0.75rem — label-to-input gap
    base:16,    // 1rem    — input padding
    lg:  20,    // 1.25rem — card internal padding
    xl:  24,    // 1.5rem  — between cards
    '2xl':32,   // 2rem    — major section gaps
    '3xl':40,   // 2.5rem  — hero padding
    '4xl':48,   // 3rem    — page top padding
    '5xl':64,   // 4rem    — hero breathing room
  },

  // ── Stop Type Colors (for route stops badges) ──
  stopColors: {
    start:   { bg: 'rgba(59,130,246,0.12)',  text: '#3B82F6', border: 'rgba(59,130,246,0.3)' },
    pickup:  { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
    dropoff: { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444', border: 'rgba(239,68,68,0.3)' },
    fuel:    { bg: 'rgba(249,115,22,0.12)',  text: '#F97316', border: 'rgba(249,115,22,0.3)' },
    rest:    { bg: 'rgba(6,182,212,0.12)',   text: '#06B6D4', border: 'rgba(6,182,212,0.3)' },
    sleep:   { bg: 'rgba(99,102,241,0.12)',  text: '#6366F1', border: 'rgba(99,102,241,0.3)' },
  },
};

// =============================================================================
// DARK THEME TOKENS
// =============================================================================

const darkTokens = {
  ...sharedTokens,

  // ── ELD Grid (Dark specific) ──
  eld: {
    ...sharedTokens.eld,
    gridLine:  'rgba(148, 163, 184, 0.15)',
    gridTick:  'rgba(148, 163, 184, 0.08)',
    gridBorder:'#334155',
  },

  // ── Dark Surface Colors ──
  surfaces: {
    dark1:      '#080C18',  // Deepest background
    dark2:      '#0F172A',  // Secondary background
    dark3:      '#1E293B',  // Card surface / elevated
    glass:      'rgba(255, 255, 255, 0.06)',  // Glassmorphism bg
    glassStrong:'rgba(255, 255, 255, 0.10)',
    glassBorder:'rgba(255, 255, 255, 0.10)',
    glassHighlight: 'rgba(255, 255, 255, 0.06)', // Inset top glow
    card:       'rgba(30, 41, 59, 0.5)',
    input:      'rgba(255, 255, 255, 0.05)',
    inputHover: 'rgba(255, 255, 255, 0.08)',
    inputFocus: 'rgba(255, 255, 255, 0.10)',
  },

  // ── Gradient Presets (Dark) ──
  gradients: {
    darkBg:     'linear-gradient(150deg, #080C18 0%, #0F1B33 30%, #1B2A4A 60%, #0F2440 100%)',
    resultsBg:  'linear-gradient(180deg, #080C18 0%, #0F172A 40%, #1E293B 100%)',
    navyButton: 'linear-gradient(135deg, #3B5A8A 0%, #4A6A9A 60%, #5A7AAA 100%)',
    navyButtonHover: 'linear-gradient(135deg, #4A6A9A 0%, #5A7AAA 50%, #6A8ABA 100%)',
    accentLine: 'linear-gradient(90deg, #1B2A4A, #F59E0B, #10B981)',
    cycleBar:   'linear-gradient(90deg, #10B981, #F59E0B)',
  },

  // ── Glassmorphism CSS Properties ──
  glass: {
    blur:       'blur(24px)',
    blurLight:  'blur(16px)',
    shadow:     '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
  },

  // ── Shadow Scale (Dark) ──
  shadows: {
    sm:    '0 1px 2px rgba(0,0,0,0.3)',
    md:    '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3)',
    lg:    '0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -4px rgba(0,0,0,0.3)',
    xl:    '0 20px 25px -5px rgba(0,0,0,0.4), 0 8px 10px -6px rgba(0,0,0,0.3)',
    glass: '0 8px 40px rgba(0,0,0,0.3)',
    glow:  '0 0 40px rgba(99,102,241,0.15)',
  },

  // ── Text Colors (Dark) ──
  text: {
    primary:   '#F8FAFC',
    secondary: '#94A3B8',
    muted:     '#64748B',
    inverse:   '#0F172A',
  },
};


// =============================================================================
// LIGHT THEME TOKENS
// =============================================================================

const lightTokens = {
  ...sharedTokens,

  // ── ELD Grid (Light specific) ──
  eld: {
    ...sharedTokens.eld,
    gridLine:  'rgba(30, 41, 59, 0.12)',
    gridTick:  'rgba(30, 41, 59, 0.06)',
    gridBorder:'#CBD5E1',
  },

  // ── Light Surface Colors ──
  surfaces: {
    light1:     '#FFFFFF',  // Primary background
    light2:     '#F8FAFC',  // Secondary background
    light3:     '#F1F5F9',  // Tertiary / elevated cards
    card:       '#FFFFFF',
    cardHover:  '#FAFBFC',
    border:     '#E2E8F0',
    borderLight:'#F1F5F9',
    input:      '#F8FAFC',
    inputHover: '#F1F5F9',
    inputFocus: '#FFFFFF',
  },

  // ── Gradient Presets (Light) ──
  gradients: {
    lightBg:    'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 50%, #F1F5F9 100%)',
    subtleBg:   'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 50%, #F0FDF4 100%)',
    formBg:     'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
    heroGradient: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 50%, #FEF3C7 100%)',
    navyButton: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 60%, #3B82F6 100%)',
    navyButtonHover: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #60A5FA 100%)',
    accentLine: 'linear-gradient(90deg, #3B82F6, #F59E0B, #10B981)',
    cycleBar:   'linear-gradient(90deg, #10B981, #F59E0B)',
  },

  // ── Glass Effect for Light Mode (subtle) ──
  glass: {
    blur:       'blur(20px)',
    blurLight:  'blur(12px)',
    shadow:     '0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  },

  // ── Shadow Scale (Light) ──
  shadows: {
    sm:    '0 1px 2px rgba(0,0,0,0.04)',
    md:    '0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04)',
    lg:    '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
    xl:    '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.04)',
    card:  '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
    cardHover: '0 10px 25px -5px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
    input: '0 1px 2px rgba(0,0,0,0.04)',
    inputFocus: '0 0 0 3px rgba(59, 130, 246, 0.15)',
  },

  // ── Text Colors (Light) ──
  text: {
    primary:   '#0F172A',
    secondary: '#475569',
    muted:     '#94A3B8',
    inverse:   '#FFFFFF',
  },

  // ── Stop Type Colors for Light Mode (adjusted for contrast) ──
  stopColors: {
    start:   { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
    pickup:  { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
    dropoff: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
    fuel:    { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
    rest:    { bg: '#ECFEFF', text: '#0E7490', border: '#A5F3FC' },
    sleep:   { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' },
  },
};


// =============================================================================
// SHARED TYPOGRAPHY (used by both themes)
// =============================================================================

const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  // Display: Hero numbers, page titles
  h1: {
    fontWeight: 800,
    fontSize: '2.5rem',
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
  },
  h2: {
    fontWeight: 800,
    fontSize: '2rem',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  // Heading: Section headers, card titles
  h3: {
    fontWeight: 700,
    fontSize: '1.5rem',
    lineHeight: 1.3,
  },
  h4: {
    fontWeight: 700,
    fontSize: '1.25rem',
    lineHeight: 1.4,
  },
  h5: {
    fontWeight: 600,
    fontSize: '1.1rem',
    lineHeight: 1.4,
  },
  h6: {
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: 1.4,
  },
  // Body: Content, descriptions
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
    fontWeight: 400,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    fontWeight: 400,
  },
  // Label/Caption
  caption: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  overline: {
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    lineHeight: 1.2,
    textTransform: 'uppercase',
  },
  // Button: sentence case, never uppercase
  button: {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.875rem',
  },
};


// =============================================================================
// DARK THEME
// =============================================================================

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
      contrastText: '#1B2A4A',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
    },
    error: {
      main: '#EF4444',
      light: '#FCA5A5',
      dark: '#DC2626',
    },
    info: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
    },
    background: {
      default: '#0F172A',
      paper: '#1E293B',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography,
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 28px',
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'scale(0.97)',
          },
        },
        containedPrimary: {
          backgroundImage: darkTokens.gradients.navyButton,
          '&:hover': {
            backgroundImage: darkTokens.gradients.navyButtonHover,
            boxShadow: '0 8px 24px rgba(59,90,138,0.4)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(0,0,0,0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: darkTokens.surfaces.dark3,
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { height: 8 },
        thumb: { width: 18, height: 18 },
        track: { borderRadius: 4 },
        rail: { borderRadius: 4, opacity: 0.3 },
      },
    },
  },
});

// Attach custom tokens to dark theme
darkTheme.custom = darkTokens;


// =============================================================================
// LIGHT THEME
// =============================================================================

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB',
      light: '#3B82F6',
      dark: '#1D4ED8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#059669',
      light: '#10B981',
      dark: '#047857',
    },
    warning: {
      main: '#D97706',
      light: '#F59E0B',
      dark: '#B45309',
    },
    error: {
      main: '#DC2626',
      light: '#EF4444',
      dark: '#B91C1C',
    },
    info: {
      main: '#2563EB',
      light: '#3B82F6',
      dark: '#1D4ED8',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
    },
    divider: '#E2E8F0',
  },
  typography,
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 28px',
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'scale(0.97)',
          },
        },
        containedPrimary: {
          backgroundImage: lightTokens.gradients.navyButton,
          '&:hover': {
            backgroundImage: lightTokens.gradients.navyButtonHover,
            boxShadow: '0 6px 20px rgba(37,99,235,0.3)',
          },
        },
        outlined: {
          borderColor: '#CBD5E1',
          '&:hover': {
            backgroundColor: '#F1F5F9',
            borderColor: '#94A3B8',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          borderBottom: '1px solid #E2E8F0',
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255,255,255,0.9)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: lightTokens.surfaces.card,
          border: '1px solid #E2E8F0',
          boxShadow: lightTokens.shadows.card,
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: lightTokens.shadows.cardHover,
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: lightTokens.surfaces.input,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: lightTokens.surfaces.inputHover,
            },
            '&.Mui-focused': {
              backgroundColor: lightTokens.surfaces.inputFocus,
              boxShadow: lightTokens.shadows.inputFocus,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          fontWeight: 600,
          fontSize: '0.7rem',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { height: 8 },
        thumb: { width: 18, height: 18 },
        track: { borderRadius: 4 },
        rail: { borderRadius: 4, opacity: 0.3 },
      },
    },
  },
});

// Attach custom tokens to light theme
lightTheme.custom = lightTokens;


// =============================================================================
// THEME UTILITIES
// =============================================================================

/**
 * Get theme by mode name
 * @param {'dark' | 'light'} mode - Theme mode
 * @returns {Object} MUI theme object
 */
export const getTheme = (mode) => {
  return mode === 'light' ? lightTheme : darkTheme;
};

/**
 * Default theme (dark mode as per v4 design specification)
 * This maintains backward compatibility with existing code
 */
const theme = darkTheme;

export default theme;

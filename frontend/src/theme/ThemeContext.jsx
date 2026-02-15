/**
 * Theme Context Provider
 * 
 * Provides theme state management with light/dark mode toggle.
 * Persists user preference to localStorage.
 * 
 * Usage:
 * 1. Wrap app with <ThemeContextProvider>
 * 2. Use useThemeMode() hook to access { mode, toggleMode, setMode }
 * 3. Theme automatically updates across the app
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { darkTheme, lightTheme } from './theme';

// Storage key for persisting theme preference
const THEME_STORAGE_KEY = 'fleet-eld-theme-mode';

// ─── Context Definition ────────────────────────────────────────
const ThemeContext = createContext({
  mode: 'dark',
  toggleMode: () => {},
  setMode: () => {},
  isDark: true,
});

/**
 * Custom hook to access theme mode and toggle functions.
 * @returns {{ mode: 'dark' | 'light', toggleMode: () => void, setMode: (mode: string) => void, isDark: boolean }}
 */
export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeContextProvider');
  }
  return context;
};

/**
 * Get initial theme mode from localStorage or system preference.
 * @returns {'dark' | 'light'}
 */
const getInitialMode = () => {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const storedMode = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedMode === 'light' || storedMode === 'dark') {
      return storedMode;
    }
    
    // Fall back to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  }
  
  // Default to light (user request)
  return 'light';
};

// ─── Provider Component ────────────────────────────────────────
export const ThemeContextProvider = ({ children }) => {
  const [mode, setModeState] = useState(getInitialMode);

  // Persist mode to localStorage and update body class
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    document.body.className = mode; // 'light' or 'dark'
  }, [mode]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const storedMode = localStorage.getItem(THEME_STORAGE_KEY);
      if (!storedMode) {
        setModeState(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Toggle between dark and light
  const toggleMode = () => {
    setModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Set specific mode
  const setMode = (newMode) => {
    if (newMode === 'dark' || newMode === 'light') {
      setModeState(newMode);
    }
  };

  // Select the appropriate theme
  const theme = useMemo(() => {
    return mode === 'light' ? lightTheme : darkTheme;
  }, [mode]);

  // Context value
  const contextValue = useMemo(() => ({
    mode,
    toggleMode,
    setMode,
    isDark: mode === 'dark',
  }), [mode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContextProvider;

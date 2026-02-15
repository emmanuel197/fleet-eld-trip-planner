/**
 * Theme Toggle Component
 * 
 * A sleek animated toggle button for switching between light and dark modes.
 * Features smooth icon transitions and visual feedback.
 * 
 * Usage:
 * <ThemeToggle />
 * <ThemeToggle showLabel />  // With "Dark" / "Light" label
 * <ThemeToggle size="small" />
 */

import React from 'react';
import { IconButton, Box, Typography, Tooltip } from '@mui/material';
import { useThemeMode } from '../theme/ThemeContext';

// Icons for light/dark mode
import LightModeIcon from '@mui/icons-material/LightModeRounded';
import DarkModeIcon from '@mui/icons-material/DarkModeRounded';

const ThemeToggle = ({ 
  showLabel = false, 
  size = 'medium',
  sx = {} 
}) => {
  const { mode, toggleMode, isDark } = useThemeMode();

  // Size configurations
  const sizes = {
    small: { button: 32, icon: 18, fontSize: '0.7rem' },
    medium: { button: 40, icon: 22, fontSize: '0.8rem' },
    large: { button: 48, icon: 26, fontSize: '0.875rem' },
  };

  const config = sizes[size] || sizes.medium;

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        ...sx 
      }}
    >
      <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} arrow>
        <IconButton
          onClick={toggleMode}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          sx={{
            width: config.button,
            height: config.button,
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden',
            // Dark mode styling
            ...(isDark ? {
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FBBF24',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.12)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                transform: 'scale(1.05)',
              },
            } : {
              // Light mode styling
              bgcolor: 'rgba(30, 41, 59, 0.06)',
              border: '1px solid rgba(30, 41, 59, 0.12)',
              color: '#6366F1',
              '&:hover': {
                bgcolor: 'rgba(30, 41, 59, 0.1)',
                borderColor: 'rgba(30, 41, 59, 0.2)',
                transform: 'scale(1.05)',
              },
            }),
            transition: 'all 0.25s ease',
            '&:active': {
              transform: 'scale(0.95)',
            },
          }}
        >
          {/* Sun icon (shown in dark mode) */}
          <LightModeIcon
            sx={{
              fontSize: config.icon,
              position: 'absolute',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
              opacity: isDark ? 1 : 0,
            }}
          />
          {/* Moon icon (shown in light mode) */}
          <DarkModeIcon
            sx={{
              fontSize: config.icon,
              position: 'absolute',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isDark ? 'rotate(-90deg) scale(0)' : 'rotate(0deg) scale(1)',
              opacity: isDark ? 0 : 1,
            }}
          />
        </IconButton>
      </Tooltip>

      {showLabel && (
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.7)',
            fontSize: config.fontSize,
            minWidth: 40,
            transition: 'color 0.2s ease',
          }}
        >
          {isDark ? 'Dark' : 'Light'}
        </Typography>
      )}
    </Box>
  );
};

export default ThemeToggle;

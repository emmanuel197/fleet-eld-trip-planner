/**
 * Crosshatch SVG Texture Component
 * 
 * Renders a repeating diagonal crosshatch pattern as an SVG overlay.
 * Used on both form page (hero bg) and results page (subtle bg texture).
 * 
 * Props:
 *   color   - SVG stroke color (default: 'white')
 *   opacity - Line opacity 0-1 (default: 0.045)
 *   size    - Pattern cell size in px (default: 16)
 */

import { Box } from '@mui/material';

function Crosshatch({ color = 'white', opacity = 0.045, size = 16 }) {
  // Unique pattern ID to prevent SVG conflicts when multiple instances render
  const patternId = `crosshatch-${color.replace('#', '')}-${opacity}`.replace(/\./g, '_');

  return (
    <Box
      component="svg"
      xmlns="http://www.w3.org/2000/svg"
      sx={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <defs>
        <pattern
          id={patternId}
          x="0" y="0"
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
        >
          <line
            x1="0" y1="0" x2={size} y2={size}
            stroke={color}
            strokeWidth="0.5"
            opacity={opacity}
          />
          <line
            x1={size} y1="0" x2="0" y2={size}
            stroke={color}
            strokeWidth="0.5"
            opacity={opacity}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </Box>
  );
}

export default Crosshatch;

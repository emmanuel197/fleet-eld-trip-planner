/**
 * AppLayout Component
 * 
 * Minimal layout wrapper. Each page (FormPage, ResultsPage)
 * manages its own full-bleed background, navbar, and layout.
 * 
 * This wrapper provides:
 * - Consistent min-height viewport
 * - Future: global modals, toasts, loading overlays
 * 
 * Why minimal: Our v4 design uses full-bleed dark backgrounds
 * on both pages. A shared AppBar/Container would break the
 * immersive dark gradient + glassmorphism design.
 */

import { Box } from '@mui/material';

function AppLayout({ children }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {children}
    </Box>
  );
}

export default AppLayout;

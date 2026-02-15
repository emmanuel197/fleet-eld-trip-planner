import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for Fleet ELD Trip Planner frontend.
 * 
 * - React plugin for JSX/Fast Refresh
 * - Proxy API requests to Django backend in development
 * - Source maps enabled for development debugging
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API requests to Django backend during development
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});

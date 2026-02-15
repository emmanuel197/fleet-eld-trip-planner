/**
 * Application entry point.
 * 
 * Sets up:
 * - ThemeContextProvider for dynamic light/dark mode switching
 * - React Router for navigation
 * - CssBaseline is handled inside ThemeContextProvider
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeContextProvider } from './theme/ThemeContext';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeContextProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeContextProvider>
  </React.StrictMode>
);

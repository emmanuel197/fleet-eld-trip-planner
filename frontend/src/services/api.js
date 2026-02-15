/**
 * API Service Layer
 * 
 * Centralized API client using Axios for all backend communication.
 * Handles base URL configuration, error handling, retry logic,
 * and request/response interceptors.
 * 
 * Pattern: Service module exports individual functions (not a class),
 * consistent with modern React patterns.
 * 
 * Features:
 * - Automatic retry on network errors (up to 3 attempts)
 * - Exponential backoff between retries
 * - Extended timeout for route calculation
 */

import axios from 'axios';

// Base URL: uses env variable in production, Vite proxy in development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Configured Axios instance with base URL and default headers.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000, // 90s timeout (route calculation can take a while with geocoding)
});

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute an API request with automatic retry on failure.
 * Uses exponential backoff between retries.
 * 
 * @param {Function} requestFn - Function that returns a promise (the API call)
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise} - The API response
 */
const withRetry = async (requestFn, maxRetries = MAX_RETRIES) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx) - these are validation errors
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
      console.log(`API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
      
      await sleep(delay);
    }
  }
  
  throw lastError;
};

// --- Response interceptor for error logging ---
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message;
    console.error(`API Error: ${message}`, error);
    return Promise.reject(error);
  }
);

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Plan a new trip with HOS compliance.
 * Includes automatic retry logic for network failures.
 * 
 * @param {Object} tripData - Trip input data
 * @param {string} tripData.current_location - Current location
 * @param {string} tripData.pickup_location - Pickup location
 * @param {string} tripData.dropoff_location - Dropoff location
 * @param {number} tripData.current_cycle_used - Hours used in 70hr/8day cycle
 * @returns {Promise<Object>} Full trip data with stops and daily logs
 */
export const planTrip = async (tripData) => {
  return withRetry(async () => {
    const response = await apiClient.post('/plan-trip/', tripData);
    return response.data;
  });
};

/**
 * Get full details for a specific trip.
 * 
 * @param {string} tripId - Trip UUID
 * @returns {Promise<Object>} Trip details with stops and daily logs
 */
export const getTripDetail = async (tripId) => {
  return withRetry(async () => {
    const response = await apiClient.get(`/trip/${tripId}/`);
    return response.data;
  });
};

/**
 * List all planned trips.
 * 
 * @returns {Promise<Array>} List of trip summaries
 */
export const getTrips = async () => {
  return withRetry(async () => {
    const response = await apiClient.get('/trips/');
    return response.data;
  });
};

/**
 * Health check - verify backend is running.
 * 
 * @returns {Promise<Object>} Health status
 */
export const healthCheck = async () => {
  const response = await apiClient.get('/health/');
  return response.data;
};

export default apiClient;

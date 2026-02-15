/**
 * Custom hooks for trip-related queries using TanStack Query.
 * 
 * Benefits:
 * - Automatic caching of trip data
 * - Request deduplication
 * - Background refetching
 * - Loading/error state management
 * - Optimistic updates ready
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTripDetail, getTripsList, planTrip } from '../services/api';

// Query keys for cache management
export const tripKeys = {
  all: ['trips'],
  lists: () => [...tripKeys.all, 'list'],
  list: (filters) => [...tripKeys.lists(), filters],
  details: () => [...tripKeys.all, 'detail'],
  detail: (id) => [...tripKeys.details(), id],
};

/**
 * Hook to fetch a single trip by ID.
 * Caches the result and handles loading/error states.
 * 
 * @param {string} tripId - UUID of the trip to fetch
 * @param {object} options - Additional react-query options
 * @returns {object} Query result with data, isLoading, error, etc.
 */
export function useTrip(tripId, options = {}) {
  return useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: () => getTripDetail(tripId),
    enabled: !!tripId, // Only run if tripId is truthy
    ...options,
  });
}

/**
 * Hook to fetch the list of all trips.
 * 
 * @param {object} options - Additional react-query options
 * @returns {object} Query result with data, isLoading, error, etc.
 */
export function useTripsList(options = {}) {
  return useQuery({
    queryKey: tripKeys.lists(),
    queryFn: getTripsList,
    ...options,
  });
}

/**
 * Hook to create a new trip (mutation).
 * Automatically invalidates trip list cache on success.
 * 
 * @param {object} options - Additional mutation options (onSuccess, onError, etc.)
 * @returns {object} Mutation result with mutate, mutateAsync, isLoading, etc.
 */
export function useCreateTrip(options = {}) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: planTrip,
    onSuccess: (data, variables, context) => {
      // Invalidate and refetch trips list
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      
      // Pre-populate the cache for this new trip
      queryClient.setQueryData(tripKeys.detail(data.id), data);
      
      // Call user's onSuccess if provided
      options.onSuccess?.(data, variables, context);
    },
    onError: options.onError,
  });
}

/**
 * Hook to prefetch a trip (for hover/preload scenarios).
 * 
 * @returns {function} Function to prefetch a trip by ID
 */
export function usePrefetchTrip() {
  const queryClient = useQueryClient();
  
  return (tripId) => {
    queryClient.prefetchQuery({
      queryKey: tripKeys.detail(tripId),
      queryFn: () => getTripDetail(tripId),
      staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    });
  };
}

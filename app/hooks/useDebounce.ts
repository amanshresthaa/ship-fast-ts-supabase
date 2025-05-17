'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * A custom hook for debouncing values
 * Implements the debouncing technique from the performance checklist
 * 
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    // Set up the timeout to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    // Clean up the timeout if the value changes before the delay has elapsed
    // This ensures we always use the most recent value
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Custom hook for debouncing functions
 * Useful for handling frequent events like window resize, scroll, or input changes
 * 
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @param deps Dependencies array for the function
 * @returns The debounced function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  fn: T, 
  delay: number = 500,
  deps: any[] = []
): (...args: Parameters<T>) => void {
  // Store the function in a ref to avoid unnecessary re-creation
  const fnRef = useRef<T>(fn);
  
  // Update the function ref when the function changes
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  
  // Use ref to store the timeout between renders
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear timeout when component unmounts or deps change
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, deps);
  
  // Return memoized debounced callback
  return useCallback(
    (...args: Parameters<T>) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        fnRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

/**
 * Custom hook for throttling functions (limit how often a function can be called)
 * Useful for scroll events, mousemove, etc.
 * 
 * @param fn The function to throttle
 * @param limit The minimum time between function calls in milliseconds
 * @returns The throttled function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number = 200
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0);
  const fnRef = useRef<T>(fn);
  
  // Update the function ref when the function changes
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  
  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastRunRef.current >= limit) {
        lastRunRef.current = now;
        fnRef.current(...args);
      }
    },
    [limit]
  );
}

// For backward compatibility
export default useDebounce;

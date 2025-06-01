'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Returns a debounced version of the provided value that updates only after the specified delay has elapsed without changes.
 *
 * @param value - The value to debounce.
 * @param delay - Time in milliseconds to wait before updating the debounced value. Defaults to 500.
 * @returns The debounced value.
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
 * Returns a debounced version of the provided callback function.
 *
 * The debounced function delays invoking the original function until after the specified delay has elapsed since the last call. Useful for reducing the frequency of function executions in response to rapid events such as input changes or window resizing.
 *
 * @param fn - The function to debounce.
 * @param delay - The debounce delay in milliseconds. Defaults to 500.
 * @param deps - Optional dependencies array to control when the debounced function is reset.
 * @returns A debounced function that delays invocation of {@link fn}.
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
 * Returns a throttled version of the provided function that can only be called once per specified time interval.
 *
 * The throttled function is useful for limiting the rate of execution in response to high-frequency events such as scrolling or mouse movement.
 *
 * @param fn - The function to throttle.
 * @param limit - The minimum interval in milliseconds between allowed calls. Defaults to 200.
 * @returns A throttled function that enforces the specified call interval.
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

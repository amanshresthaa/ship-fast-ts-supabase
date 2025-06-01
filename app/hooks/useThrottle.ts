// app/hooks/useThrottle.ts
import { useRef, useEffect, useCallback } from 'react';

/**
 * Returns a throttled version of the given callback that invokes at most once per specified delay.
 *
 * The throttled function ensures that the callback is called immediately if the delay has elapsed since the last call, or schedules a call with the latest arguments after the remaining delay. Pending timeouts are cleared on component unmount to prevent memory leaks.
 *
 * @param callback - The function to throttle.
 * @param delay - Minimum interval between calls in milliseconds. Defaults to 200.
 * @returns A throttled function that limits invocation frequency of {@link callback}.
 */
function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 200
): (...args: Parameters<T>) => void {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgs = useRef<Parameters<T> | null>(null);

  // Clean up any pending timeouts when the component unmounts
  // This prevents memory leaks and unnecessary function calls
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Create the throttled function
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    // Store the latest arguments
    lastArgs.current = args;
    
    // Calculate remaining time until next allowed call
    const remaining = delay - (now - lastCall.current);
    
    // If we've waited long enough, call the function immediately
    if (remaining <= 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      lastCall.current = now;
      callback(...args);
    } 
    // Otherwise, schedule a call with the most recent arguments
    else if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now();
        timeoutRef.current = null;
        if (lastArgs.current) {
          callback(...lastArgs.current);
        }
      }, remaining);
    }
  }, [callback, delay]);
}

export default useThrottle;

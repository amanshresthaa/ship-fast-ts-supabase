// app/hooks/useMemoizedCallback.ts
import { useCallback, useRef, useEffect } from 'react';

/**
 * A hook that creates a memoized callback with dependencies tracking
 * Provides deeper memoization than standard useCallback
 * 
 * @param callback The callback function to memoize
 * @param deps Dependencies array for the callback
 * @returns A memoized version of the callback that only changes when dependencies change
 */
function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  // Use refs to track the latest callback and dependencies
  const callbackRef = useRef<T>(callback);
  const depsRef = useRef<React.DependencyList>(deps);
  
  // Check if dependencies have changed
  let depsChanged = deps.length !== depsRef.current.length;
  if (!depsChanged) {
    for (let i = 0; i < deps.length; i++) {
      if (!Object.is(deps[i], depsRef.current[i])) {
        depsChanged = true;
        break;
      }
    }
  }
  
  // Update refs if deps changed
  useEffect(() => {
    callbackRef.current = callback;
    depsRef.current = deps;
  });
  
  // Create a stable callback that always uses the latest function
  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    // Only change the callback identity if deps have changed
    [depsChanged]
  );
}

export default useMemoizedCallback;

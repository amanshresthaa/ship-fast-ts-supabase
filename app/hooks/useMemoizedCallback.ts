// app/hooks/useMemoizedCallback.ts
import { useCallback, useRef, useEffect } from 'react';

/**
 * Returns a memoized callback whose identity only changes when the specified dependencies change, ensuring the latest callback is always invoked.
 *
 * Unlike React's standard `useCallback`, this hook tracks dependency changes using shallow equality checks, providing more precise memoization when dependencies are complex or frequently recreated.
 *
 * @param callback - The function to be memoized.
 * @param deps - The list of dependencies that control when the memoized callback identity updates.
 * @returns A stable callback function that always calls the latest {@link callback}, with its identity updated only when {@link deps} change.
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

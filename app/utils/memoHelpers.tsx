'use client';

import { memo } from 'react';

/**
 * Enhanced React.memo with automatic naming for debugging
 * Preserves component displayName for better debugging in React DevTools
 * 
 * @param Component The component to memoize
 * @param propsAreEqual Optional comparison function
 * @returns Memoized component with preserved displayName
 */
export function MemoWithName<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): React.NamedExoticComponent<P> {
  const displayName = Component.displayName || Component.name || 'Component';
  const MemoComponent = memo(Component, propsAreEqual);
  MemoComponent.displayName = `Memo(${displayName})`;
  return MemoComponent;
}

/**
 * Compare props shallowly but deeply compare specific keys
 * Use with React.memo for optimized comparisons
 * 
 * @example
 * const MemoizedComponent = memo(MyComponent, 
 *   createPropsComparator(['complexProp', 'anotherProp'])
 * );
 */
export function createPropsComparator<P extends object>(deepCompareProps: (keyof P)[] = []): (prevProps: P, nextProps: P) => boolean {
  return (prevProps: P, nextProps: P): boolean => {
    // First check for shallow equality (fast path)
    if (Object.is(prevProps, nextProps)) {
      return true;
    }
    
    // Check each shallow prop
    for (const key in prevProps) {
      // Skip deep compare props
      if (deepCompareProps.includes(key as keyof P)) {
        continue;
      }
      
      if (!Object.is(prevProps[key], nextProps[key])) {
        return false;
      }
    }
    
    // Now handle deep comparison props
    for (const key of deepCompareProps) {
      // Basic deep comparison for objects and arrays
      if (!deepEqual(prevProps[key], nextProps[key])) {
        return false;
      }
    }
    
    return true;
  };
}

/**
 * Simple deep equality check
 */
function deepEqual(a: any, b: any): boolean {
  // Handle primitive types and referential equality
  if (a === b) return true;
  
  // Handle null/undefined
  if (a == null || b == null) return a === b;
  
  // Different types
  if (typeof a !== typeof b) return false;
  
  // Handle Date objects
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!b.hasOwnProperty(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    
    return true;
  }
  
  return false;
}

/**
 * Log component renders to help identify unnecessary re-renders
 * Use during development only
 * 
 * @example
 * export default withRenderLog(MyComponent);
 */
export function withRenderLog<P extends object>(
  Component: React.ComponentType<P>,
  options: { 
    name?: string;
    logProps?: boolean;
    logUpdates?: boolean;
  } = {}
): React.FC<P> {
  // Only apply in development
  if (process.env.NODE_ENV !== 'development') {
    return Component as React.FC<P>;
  }
  
  const {
    name = Component.displayName || Component.name || 'Component',
    logProps = false,
    logUpdates = true
  } = options;
  
  const WithRenderLog: React.FC<P> = (props) => {
    console.log(`%c📊 Rendering ${name}`, 'color: #3b82f6; font-weight: bold;');
    
    if (logProps) {
      console.log(`Props for ${name}:`, props);
    }
    
    return <Component {...props} />;
  };
  
  WithRenderLog.displayName = `WithRenderLog(${name})`;
  return WithRenderLog;
}

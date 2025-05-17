'use client';

// Re-export all optimization utilities
export { useDebounce, useDebouncedCallback, useThrottle } from '../hooks/useDebounce';
export { default as useNetwork } from '../hooks/useNetwork';
export { default as useRenderMetrics, withRenderMetrics } from '../hooks/useRenderMetrics';
export { default as useVirtualizedList } from '../hooks/useVirtualizedList';
export { usePerformanceMetrics, withPerformanceTracking } from '../utils/performance';
export { DataCache, useDataCache, globalCache } from '../utils/dataCache';
export { tw, twIf, twMerge, twGroup, classNames } from '../utils/tw';
export { MemoWithName, createPropsComparator, withRenderLog } from '../utils/memoHelpers';
export { 
  loadFont, 
  preloadFont, 
  useFontLoading, 
  getFontStatus 
} from '../utils/fontLoader';

/**
 * Performance optimization toolkit for the quiz application
 * 
 * This module centralizes all performance optimization utilities and hooks:
 * 
 * Rendering Optimizations:
 * - MemoWithName: Enhanced React.memo with better debug names
 * - createPropsComparator: Custom prop comparison for React.memo
 * - withRenderLog: HOC to track component renders during development
 * 
 * CSS Optimizations:
 * - tw: Utility for conditionally applying Tailwind classes
 * - twIf: Apply different classes based on a condition
 * - twMerge: Merge Tailwind classes resolving conflicts
 * 
 * Data Loading Optimizations:
 * - useDataCache: Smart data caching hook
 * - DataCache: In-memory cache with expiration
 * - useNetwork: Network quality and connection detection
 * 
 * Performance Measurement:
 * - useRenderMetrics: Track component render performance
 * - usePerformanceMetrics: More detailed performance metrics
 * 
 * Input Handling:
 * - useDebounce: Debounce rapidly changing values
 * - useDebouncedCallback: Debounce function calls
 * - useThrottle: Throttle frequent function calls
 * 
 * Large Lists:
 * - useVirtualizedList: Only render visible items in long lists
 * 
 * Font Loading:
 * - useFontLoading: Control font loading behavior
 */

// Helper functions

/**
 * Check if the code is running on client or server
 */
export const isClient = typeof window !== 'undefined';
export const isServer = !isClient;

/**
 * Check if the app is running in development mode
 */
export const isDev = process.env.NODE_ENV === 'development';
export const isProd = process.env.NODE_ENV === 'production';

/**
 * RAF (requestAnimationFrame) helper for scheduling visual updates
 */
export function raf(callback: () => void): void {
  if (isClient) {
    requestAnimationFrame(callback);
  }
}

/**
 * Double RAF for ensuring DOM updates have been painted
 */
export function doubleRaf(callback: () => void): void {
  raf(() => {
    raf(callback);
  });
}

/**
 * Idle callback helper for non-critical work
 */
export function idle(callback: () => void, timeout = 1000): void {
  if (isClient) {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback, { timeout });
    } else {
      setTimeout(callback, 100); // Fallback for browsers without requestIdleCallback
    }
  }
}

/**
 * Detect high-end device for enabling enhanced animations
 */
export function isHighEndDevice(): boolean {
  if (!isClient) return false;
  
  // Use hardware concurrency as a proxy for device capability
  const cores = navigator.hardwareConcurrency || 2;
  
  // Use deviceMemory API if available
  const memory = (navigator as any).deviceMemory || 4;
  
  return cores >= 4 && memory >= 4;
}

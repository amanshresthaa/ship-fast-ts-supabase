'use client';

import { useEffect, useRef } from 'react';

/**
 * Performance metrics interface for tracking component performance
 */
interface PerformanceMetrics {
  componentName: string;
  renderCount: number;
  renderDuration: number;
  firstRender: boolean;
  renderStartTime: number;
  lastRenderTime: number;
  averageRenderDuration: number;
  totalRenderDuration: number;
}

// Store component metrics globally for easier access in dev tools
const componentMetrics: Record<string, PerformanceMetrics> = {};

// Define whether metrics are enabled (can be toggled via window.__ENABLE_METRICS__)
let metricsEnabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'development';

// Configure metrics collection globally
if (typeof window !== 'undefined') {
  // @ts-ignore - Add global access for toggling metrics
  window.__ENABLE_METRICS__ = (enabled: boolean = true) => {
    metricsEnabled = enabled;
    console.log(`Performance metrics ${enabled ? 'enabled' : 'disabled'}`);
  };

  // @ts-ignore - Add global access to view metrics
  window.__GET_METRICS__ = () => {
    console.table(componentMetrics);
    return componentMetrics;
  };

  // @ts-ignore - Add global access to reset metrics
  window.__RESET_METRICS__ = () => {
    Object.keys(componentMetrics).forEach(key => delete componentMetrics[key]);
    console.log('Performance metrics reset');
  };
}

/**
 * Custom hook to track component rendering performance
 * 
 * @param componentName The name of the component to track
 * @param enabled Whether metrics collection is enabled for this component
 */
export function usePerformanceMetrics(componentName: string, enabled: boolean = true) {
  const renderCountRef = useRef(0);
  const renderStartTimeRef = useRef(0);
  const metricsRef = useRef<PerformanceMetrics>({
    componentName,
    renderCount: 0,
    renderDuration: 0,
    firstRender: true,
    renderStartTime: 0,
    lastRenderTime: 0,
    averageRenderDuration: 0,
    totalRenderDuration: 0
  });

  // On mount, start tracking render time
  useEffect(() => {
    if (!metricsEnabled || !enabled) return;
    
    // End of render - calculate duration
    const renderEndTime = performance.now();
    const renderDuration = renderStartTimeRef.current > 0
      ? renderEndTime - renderStartTimeRef.current 
      : 0;
    
    // Update metrics
    const currentCount = renderCountRef.current;
    const metrics = metricsRef.current;
    
    metrics.renderCount = currentCount;
    metrics.renderDuration = renderDuration;
    metrics.lastRenderTime = renderEndTime;
    metrics.firstRender = currentCount === 1;
    metrics.totalRenderDuration += renderDuration;
    metrics.averageRenderDuration = metrics.totalRenderDuration / currentCount;
    
    // Store metrics globally
    componentMetrics[componentName] = metrics;
    
    // Log performance if significant (over 10ms)
    if (renderDuration > 10) {
      console.log(
        `%c${componentName} rendered in ${renderDuration.toFixed(2)}ms (${currentCount}${metrics.firstRender ? ', first render' : ''})`,
        'color: #ff9800; font-weight: bold;'
      );
    }
  });

  // Track render count and start time
  renderCountRef.current += 1;
  renderStartTimeRef.current = performance.now();

  return null;
}

/**
 * Performance wrapper component to track component rendering
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  options: { componentName?: string; enabled?: boolean } = {}
) {
  const wrappedComponent = (props: P) => {
    const componentName = options.componentName || Component.displayName || Component.name || 'UnknownComponent';
    usePerformanceMetrics(componentName, options.enabled);
    return <Component {...props} />;
  };

  wrappedComponent.displayName = `WithPerformanceTracking(${Component.displayName || Component.name || 'Component'})`;
  
  return wrappedComponent;
}

'use client';

import { useEffect, useRef, useState } from 'react';

interface RenderMetrics {
  renders: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
}

/**
 * Tracks and records render performance metrics for a React component during development.
 *
 * @param componentName - The display name used to identify the component in metrics and logs.
 *
 * @remark
 * Metrics are only collected in development mode. Render statistics are stored on the global {@link window.__RENDER_METRICS__} object for inspection in the browser console.
 */
export default function useRenderMetrics(componentName: string): void {
  const renderCount = useRef(0);
  const lastRenderTimeRef = useRef(performance.now());
  const metricsRef = useRef<RenderMetrics>({
    renders: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0
  });

  // Only perform measurements in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Track render count
  renderCount.current += 1;
  const currentRender = renderCount.current;

  useEffect(() => {
    // Measure time since component rendered
    const endTime = performance.now();
    const renderTime = endTime - lastRenderTimeRef.current;
    
    // Update metrics
    const metrics = metricsRef.current;
    metrics.renders = currentRender;
    metrics.lastRenderTime = renderTime;
    metrics.totalRenderTime += renderTime;
    metrics.averageRenderTime = metrics.totalRenderTime / currentRender;
    
    // Log to console on significant render time (> 10ms)
    if (renderTime > 10) {
      console.log(
        `%c${componentName} rendered in ${renderTime.toFixed(2)}ms (render #${currentRender})`,
        'color: #ff9800; font-weight: bold;'
      );
    }
    
    // Store metrics in global object for browser console access
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.__RENDER_METRICS__ = window.__RENDER_METRICS__ || {};
      // @ts-ignore
      window.__RENDER_METRICS__[componentName] = metrics;
    }
  });

  // Reset timer for next render
  lastRenderTimeRef.current = performance.now();
}

/**
 * Wraps a React component to enable render performance tracking during development.
 *
 * The wrapped component will collect and store render metrics, including render count and timing information, accessible via the browser console.
 *
 * @param Component - The React component to be wrapped.
 * @param options - Optional settings, including a custom display name for metrics tracking.
 * @returns A new component with render metrics tracking enabled.
 */
export function withRenderMetrics<P extends object>(
  Component: React.ComponentType<P>,
  options: { name?: string } = {}
) {
  const displayName = options.name || Component.displayName || Component.name;
  
  const WrappedComponent = (props: P) => {
    useRenderMetrics(displayName);
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `WithRenderMetrics(${displayName})`;
  return WrappedComponent;
}

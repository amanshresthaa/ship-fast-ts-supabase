'use client';

import React, { useEffect, useRef, useState } from 'react';

interface RenderMetrics {
  renders: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
}

/**
 * Custom hook for tracking component render performance
 * @returns A debug object with render metrics
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

  const isProduction = process.env.NODE_ENV === 'production';
  
  // Track render count
  renderCount.current += 1;
  const currentRender = renderCount.current;

  useEffect(() => {
    // Only perform measurements in development
    if (isProduction) {
      return;
    }
    
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
 * Higher-order component wrapper for tracking render performance
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

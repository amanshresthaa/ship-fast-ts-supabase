'use client';

import React, { useEffect, useState } from 'react';
import { useResponsive } from '@/app/hooks/useResponsive';

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  cls: number | null; // Cumulative Layout Shift
  fid: number | null; // First Input Delay
  ttfb: number | null; // Time to First Byte
}

interface ResponsivePerformanceData {
  deviceType: string;
  viewport: string;
  metrics: PerformanceMetrics;
  memoryUsage?: any;
  connectionType?: string;
}

/**
 * Performance monitoring component for responsive design
 * Tracks Core Web Vitals and device-specific performance metrics
 */
export const PerformanceMonitor: React.FC<{ showDetails?: boolean }> = ({ 
  showDetails = false 
}) => {
  const { deviceType, breakpoint, width, height } = useResponsive();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    cls: null,
    fid: null,
    ttfb: null,
  });
  const [performanceData, setPerformanceData] = useState<ResponsivePerformanceData | null>(null);

  useEffect(() => {
    // Performance Observer for Core Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }));
        }
      });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lcpEntry = entries[entries.length - 1];
        if (lcpEntry) {
          setMetrics(prev => ({ ...prev, lcp: lcpEntry.startTime }));
        }
      });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0;
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        setMetrics(prev => ({ ...prev, cls: clsValue }));
      });

      // First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const fidEntry = entries[0];
        if (fidEntry) {
          setMetrics(prev => ({ 
            ...prev, 
            fid: (fidEntry as any).processingStart - fidEntry.startTime 
          }));
        }
      });

      try {
        fcpObserver.observe({ type: 'paint', buffered: true });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (error) {
        console.warn('Performance monitoring not fully supported:', error);
      }

      // Navigation timing for TTFB
      if (window.performance.timing) {
        const ttfb = window.performance.timing.responseStart - window.performance.timing.navigationStart;
        setMetrics(prev => ({ ...prev, ttfb }));
      }

      return () => {
        fcpObserver.disconnect();
        lcpObserver.disconnect();
        clsObserver.disconnect();
        fidObserver.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    // Update performance data when device changes
    const data: ResponsivePerformanceData = {
      deviceType,
      viewport: `${width}x${height}`,
      metrics,
      memoryUsage: (navigator as any).memory ? {
        used: Math.round((navigator as any).memory.usedJSHeapSize / 1048576),
        total: Math.round((navigator as any).memory.totalJSHeapSize / 1048576),
        limit: Math.round((navigator as any).memory.jsHeapSizeLimit / 1048576),
      } : undefined,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown'
    };
    
    setPerformanceData(data);
  }, [deviceType, width, height, metrics]);

  // Helper function to get performance score color
  const getScoreColor = (metric: string, value: number | null): string => {
    if (value === null) return 'text-gray-400';
    
    switch (metric) {
      case 'fcp':
        return value <= 1800 ? 'text-green-500' : value <= 3000 ? 'text-yellow-500' : 'text-red-500';
      case 'lcp':
        return value <= 2500 ? 'text-green-500' : value <= 4000 ? 'text-yellow-500' : 'text-red-500';
      case 'cls':
        return value <= 0.1 ? 'text-green-500' : value <= 0.25 ? 'text-yellow-500' : 'text-red-500';
      case 'fid':
        return value <= 100 ? 'text-green-500' : value <= 300 ? 'text-yellow-500' : 'text-red-500';
      case 'ttfb':
        return value <= 800 ? 'text-green-500' : value <= 1800 ? 'text-yellow-500' : 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  if (!showDetails) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h4 className="font-bold mb-3 text-yellow-400">Performance Monitor</h4>
      
      {/* Device Info */}
      <div className="mb-3 pb-2 border-b border-gray-600">
        <div>Device: <span className="text-blue-400">{performanceData?.deviceType}</span></div>
        <div>Viewport: <span className="text-blue-400">{performanceData?.viewport}</span></div>
        <div>Breakpoint: <span className="text-blue-400">{breakpoint}</span></div>
        {performanceData?.connectionType && (
          <div>Connection: <span className="text-blue-400">{performanceData.connectionType}</span></div>
        )}
      </div>

      {/* Core Web Vitals */}
      <div className="space-y-1">
        <div className="font-semibold text-green-400 mb-2">Core Web Vitals:</div>
        
        <div className="flex justify-between">
          <span>FCP:</span>
          <span className={getScoreColor('fcp', metrics.fcp)}>
            {metrics.fcp ? `${Math.round(metrics.fcp)}ms` : 'Loading...'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>LCP:</span>
          <span className={getScoreColor('lcp', metrics.lcp)}>
            {metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'Loading...'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>CLS:</span>
          <span className={getScoreColor('cls', metrics.cls)}>
            {metrics.cls !== null ? metrics.cls.toFixed(3) : 'Loading...'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>FID:</span>
          <span className={getScoreColor('fid', metrics.fid)}>
            {metrics.fid ? `${Math.round(metrics.fid)}ms` : 'Waiting...'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>TTFB:</span>
          <span className={getScoreColor('ttfb', metrics.ttfb)}>
            {metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : 'Loading...'}
          </span>
        </div>
      </div>

      {/* Memory Usage */}
      {performanceData?.memoryUsage && (
        <div className="mt-3 pt-2 border-t border-gray-600">
          <div className="font-semibold text-purple-400 mb-1">Memory (MB):</div>
          <div className="flex justify-between text-xs">
            <span>Used:</span>
            <span className="text-purple-300">{performanceData.memoryUsage.used}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Total:</span>
            <span className="text-purple-300">{performanceData.memoryUsage.total}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Hook for tracking responsive performance metrics
 */
export const usePerformanceTracking = () => {
  const { deviceType, breakpoint } = useResponsive();
  const [performanceScore, setPerformanceScore] = useState<number>(0);

  useEffect(() => {
    // Calculate a simple performance score based on device type
    const calculateScore = () => {
      let score = 100;
      
      // Penalize mobile devices less as they're expected to be slower
      if (deviceType === 'mobile') {
        score = Math.max(score - 10, 0);
      }
      
      // Consider memory usage if available
      if ((navigator as any).memory) {
        const memoryUsage = (navigator as any).memory.usedJSHeapSize / (navigator as any).memory.jsHeapSizeLimit;
        if (memoryUsage > 0.8) score = Math.max(score - 20, 0);
        else if (memoryUsage > 0.6) score = Math.max(score - 10, 0);
      }
      
      // Consider connection type
      const connection = (navigator as any).connection;
      if (connection) {
        switch (connection.effectiveType) {
          case 'slow-2g':
          case '2g':
            score = Math.max(score - 30, 0);
            break;
          case '3g':
            score = Math.max(score - 15, 0);
            break;
          case '4g':
            // No penalty
            break;
        }
      }
      
      setPerformanceScore(score);
    };

    calculateScore();
  }, [deviceType, breakpoint]);

  return {
    performanceScore,
    deviceType,
    breakpoint,
  };
};

export default PerformanceMonitor;

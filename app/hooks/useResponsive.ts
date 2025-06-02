"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';

// Enhanced breakpoint definitions following mobile-first approach
export const BREAKPOINTS = {
  xs: 0,      // 0px - 575px (Mobile phones)
  sm: 576,    // 576px - 767px (Mobile large)  
  md: 768,    // 768px - 991px (Tablets)
  lg: 992,    // 992px - 1199px (Desktop)
  xl: 1200,   // 1200px - 1399px (Large desktop)
  xxl: 1400,  // 1400px+ (Extra large)
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;
export type DeviceType = 'mobile' | 'mobile-large' | 'tablet' | 'desktop' | 'desktop-large' | 'desktop-xl';

// Device type mapping based on breakpoints
const getDeviceType = (width: number): DeviceType => {
  if (width < BREAKPOINTS.sm) return 'mobile';
  if (width < BREAKPOINTS.md) return 'mobile-large';
  if (width < BREAKPOINTS.lg) return 'tablet';
  if (width < BREAKPOINTS.xl) return 'desktop';
  if (width < BREAKPOINTS.xxl) return 'desktop-large';
  return 'desktop-xl';
};

// Get current breakpoint based on width
const getCurrentBreakpoint = (width: number): BreakpointKey => {
  if (width >= BREAKPOINTS.xxl) return 'xxl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

interface ResponsiveState {
  width: number;
  height: number;
  breakpoint: BreakpointKey;
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
  orientation: 'portrait' | 'landscape';
}

interface UseResponsiveOptions {
  debounceMs?: number;
  ssr?: boolean;
  initialWidth?: number;
  initialHeight?: number;
}

/**
 * Enhanced responsive hook with comprehensive device detection and breakpoint management
 * 
 * Features:
 * - Real-time screen size tracking
 * - Device type detection (mobile, tablet, desktop, etc.)
 * - Breakpoint-based conditional rendering helpers
 * - Orientation detection
 * - SSR-safe with fallback values
 * - Performance optimized with debouncing
 * - Memory leak prevention with proper cleanup
 * 
 * @param options - Configuration options
 * @returns Responsive state and utility functions
 */
export const useResponsive = (options: UseResponsiveOptions = {}) => {
  const {
    debounceMs = 150,
    ssr = true,
    initialWidth = 1200,
    initialHeight = 800,
  } = options;

  // Initialize state with SSR-safe defaults
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined' && ssr) {
      // SSR fallback - assume desktop for initial render
      return {
        width: initialWidth,
        height: initialHeight,
        breakpoint: getCurrentBreakpoint(initialWidth),
        deviceType: getDeviceType(initialWidth),
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLarge: true,
        orientation: initialWidth > initialHeight ? 'landscape' : 'portrait',
      };
    }

    // Client-side initialization
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      width,
      height,
      breakpoint: getCurrentBreakpoint(width),
      deviceType: getDeviceType(width),
      isMobile: width < BREAKPOINTS.md,
      isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
      isDesktop: width >= BREAKPOINTS.lg,
      isLarge: width >= BREAKPOINTS.xl,
      orientation: width > height ? 'landscape' : 'portrait',
    };
  });

  // Debounced resize handler to prevent excessive re-renders
  const updateDimensions = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getCurrentBreakpoint(width);
    const deviceType = getDeviceType(width);

    setState({
      width,
      height,
      breakpoint,
      deviceType,
      isMobile: width < BREAKPOINTS.md,
      isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
      isDesktop: width >= BREAKPOINTS.lg,
      isLarge: width >= BREAKPOINTS.xl,
      orientation: width > height ? 'landscape' : 'portrait',
    });
  }, []);

  // Setup resize listener with debouncing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, debounceMs);
    };

    // Initial call to set correct dimensions on mount
    updateDimensions();

    // Add event listeners
    window.addEventListener('resize', debouncedResize, { passive: true });
    window.addEventListener('orientationchange', debouncedResize, { passive: true });

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', debouncedResize);
    };
  }, [updateDimensions, debounceMs]);

  // Utility functions for conditional rendering and breakpoint checks
  const utilities = useMemo(() => ({
    // Breakpoint comparison utilities
    isBreakpoint: (bp: BreakpointKey) => state.breakpoint === bp,
    isBreakpointUp: (bp: BreakpointKey) => state.width >= BREAKPOINTS[bp],
    isBreakpointDown: (bp: BreakpointKey) => state.width < BREAKPOINTS[bp],
    isBreakpointBetween: (min: BreakpointKey, max: BreakpointKey) => 
      state.width >= BREAKPOINTS[min] && state.width < BREAKPOINTS[max],

    // Device type utilities
    isDevice: (device: DeviceType) => state.deviceType === device,
    isMobileDevice: () => state.isMobile,
    isTabletDevice: () => state.isTablet,
    isDesktopDevice: () => state.isDesktop,
    isLargeDevice: () => state.isLarge,

    // Touch device detection (approximate)
    isTouchDevice: () => {
      if (typeof window === 'undefined') return false;
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    // Orientation utilities
    isPortrait: () => state.orientation === 'portrait',
    isLandscape: () => state.orientation === 'landscape',

    // Conditional rendering helpers
    showOn: (breakpoints: BreakpointKey | BreakpointKey[]) => {
      const bps = Array.isArray(breakpoints) ? breakpoints : [breakpoints];
      return bps.includes(state.breakpoint);
    },

    hideOn: (breakpoints: BreakpointKey | BreakpointKey[]) => {
      const bps = Array.isArray(breakpoints) ? breakpoints : [breakpoints];
      return !bps.includes(state.breakpoint);
    },

    // CSS classes generator for responsive design
    getResponsiveClasses: (classMap: Partial<Record<BreakpointKey | DeviceType, string>>) => {
      const classes: string[] = [];
      
      // Add breakpoint-specific classes
      if (classMap[state.breakpoint]) {
        classes.push(classMap[state.breakpoint]!);
      }
      
      // Add device-type-specific classes
      if (classMap[state.deviceType]) {
        classes.push(classMap[state.deviceType]!);
      }
      
      return classes.join(' ');
    },

    // Media query string generators
    getMediaQuery: (bp: BreakpointKey, direction: 'up' | 'down' = 'up') => {
      if (direction === 'up') {
        return `(min-width: ${BREAKPOINTS[bp]}px)`;
      }
      return `(max-width: ${BREAKPOINTS[bp] - 1}px)`;
    },
  }), [state]);

  return {
    // Current state
    ...state,
    
    // Utility functions
    ...utilities,
    
    // Raw breakpoint values for advanced usage
    BREAKPOINTS,
  };
};

// Hook for simple breakpoint-based conditional rendering
export const useBreakpoint = (breakpoint: BreakpointKey, direction: 'up' | 'down' = 'up') => {
  const { isBreakpointUp, isBreakpointDown } = useResponsive();
  
  return direction === 'up' ? isBreakpointUp(breakpoint) : isBreakpointDown(breakpoint);
};

// Hook for device type detection
export const useDeviceType = () => {
  const { deviceType, isMobile, isTablet, isDesktop } = useResponsive();
  
  return {
    deviceType,
    isMobile,
    isTablet, 
    isDesktop,
  };
};

// Hook for media query matching
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Use the newer API if available, fallback to deprecated one
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // @ts-ignore - For older browsers
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
};

export default useResponsive;

'use client';

import { useState, useEffect, useCallback } from 'react';

// Define breakpoint keys and their corresponding pixel values
export type BreakpointKey = 'mobile' | 'mobile-large' | 'tablet' | 'desktop' | 'desktop-large' | 'desktop-xl';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// Extended device type that includes all breakpoints for more granular control
export type ExtendedDeviceType = BreakpointKey;

// Breakpoint definitions (matching Tailwind CSS defaults)
const BREAKPOINTS: Record<BreakpointKey, number> = {
  'mobile': 0,
  'mobile-large': 425,
  'tablet': 768,
  'desktop': 1024,
  'desktop-large': 1440,
  'desktop-xl': 1920,
};

interface ResponsiveClasses {
  mobile?: string;
  'mobile-large'?: string;
  tablet?: string;
  desktop?: string;
  'desktop-large'?: string;
  'desktop-xl'?: string;
}

interface UseResponsiveReturn {
  // Device detection
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Device type
  deviceType: DeviceType;
  
  // Touch device detection
  isTouchDevice: boolean;
  
  // Screen dimensions
  screenWidth: number;
  screenHeight: number;
  width: number; // Alias for screenWidth
  height: number; // Alias for screenHeight
  
  // Orientation
  orientation: 'portrait' | 'landscape';
  
  // Breakpoint utilities
  isBreakpointUp: (breakpoint: BreakpointKey) => boolean;
  isBreakpointDown: (breakpoint: BreakpointKey) => boolean;
  isBreakpointBetween: (min: BreakpointKey, max: BreakpointKey) => boolean;
  
  // Responsive class utilities
  getResponsiveClasses: (classes: ResponsiveClasses) => string;
  
  // Current breakpoint
  currentBreakpoint: BreakpointKey;
  breakpoint: BreakpointKey; // Alias for currentBreakpoint
}

// Custom hook for responsive design utilities
export const useResponsive = (): UseResponsiveReturn => {
  const [screenWidth, setScreenWidth] = useState<number>(0);
  const [screenHeight, setScreenHeight] = useState<number>(0);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  // Initialize dimensions and touch detection
  useEffect(() => {
    const updateDimensions = () => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
    };

    const detectTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };

    // Initial setup
    updateDimensions();
    detectTouchDevice();

    // Add event listeners
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, []);

  // Device detection based on screen width
  const isMobile = screenWidth < BREAKPOINTS.tablet;
  const isTablet = screenWidth >= BREAKPOINTS.tablet && screenWidth < BREAKPOINTS.desktop;
  const isDesktop = screenWidth >= BREAKPOINTS.desktop;

  // Determine device type
  const deviceType: DeviceType = 
    isMobile ? 'mobile' : 
    isTablet ? 'tablet' : 
    'desktop';

  // Get current breakpoint
  const currentBreakpoint: BreakpointKey = 
    screenWidth >= BREAKPOINTS['desktop-xl'] ? 'desktop-xl' :
    screenWidth >= BREAKPOINTS['desktop-large'] ? 'desktop-large' :
    screenWidth >= BREAKPOINTS.desktop ? 'desktop' :
    screenWidth >= BREAKPOINTS.tablet ? 'tablet' :
    screenWidth >= BREAKPOINTS['mobile-large'] ? 'mobile-large' :
    'mobile';

  // Calculate orientation
  const orientation: 'portrait' | 'landscape' = screenWidth < screenHeight ? 'portrait' : 'landscape';

  // Breakpoint utility functions
  const isBreakpointUp = useCallback((breakpoint: BreakpointKey): boolean => {
    return screenWidth >= BREAKPOINTS[breakpoint];
  }, [screenWidth]);

  const isBreakpointDown = useCallback((breakpoint: BreakpointKey): boolean => {
    return screenWidth < BREAKPOINTS[breakpoint];
  }, [screenWidth]);

  const isBreakpointBetween = useCallback((min: BreakpointKey, max: BreakpointKey): boolean => {
    return screenWidth >= BREAKPOINTS[min] && screenWidth < BREAKPOINTS[max];
  }, [screenWidth]);

  // Get responsive classes based on current breakpoint
  const getResponsiveClasses = useCallback((classes: ResponsiveClasses): string => {
    const activeClasses: string[] = [];
    
    // Get the current breakpoint class
    const currentClass = classes[currentBreakpoint];
    if (currentClass) {
      activeClasses.push(currentClass);
    }
    
    // Fallback to lower breakpoints if current is not defined
    if (!currentClass) {
      const breakpointOrder: BreakpointKey[] = [
        'desktop-xl', 'desktop-large', 'desktop', 'tablet', 'mobile-large', 'mobile'
      ];
      
      for (const bp of breakpointOrder) {
        if (screenWidth >= BREAKPOINTS[bp] && classes[bp]) {
          activeClasses.push(classes[bp]);
          break;
        }
      }
    }
    
    return activeClasses.join(' ');
  }, [currentBreakpoint, screenWidth]);

  return {
    // Device detection
    isMobile,
    isTablet,
    isDesktop,
    
    // Device type
    deviceType,
    
    // Touch device detection
    isTouchDevice,
    
    // Screen dimensions
    screenWidth,
    screenHeight,
    width: screenWidth, // Alias for screenWidth
    height: screenHeight, // Alias for screenHeight
    
    // Orientation
    orientation,
    
    // Breakpoint utilities
    isBreakpointUp,
    isBreakpointDown,
    isBreakpointBetween,
    
    // Responsive class utilities
    getResponsiveClasses,
    
    // Current breakpoint
    currentBreakpoint,
    breakpoint: currentBreakpoint, // Alias for currentBreakpoint
  };
};

// Default export for convenience
export default useResponsive;

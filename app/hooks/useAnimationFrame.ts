'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseAnimationFrameOptions {
  duration?: number;
  delay?: number;
  easing?: (t: number) => number;
  onComplete?: () => void;
}

/**
 * Custom hook for smooth animations using requestAnimationFrame
 * Returns a progress value between 0 and 1
 */
export default function useAnimationFrame({
  duration = 300,
  delay = 0,
  easing = t => t,
  onComplete
}: UseAnimationFrameOptions = {}) {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const animate = useCallback(() => {
    setIsRunning(true);
    
    // Track animation start time
    let startTime = performance.now();
    let animationFrameId: number;
    let delayTimeout: ReturnType<typeof setTimeout> | null = null;
    
    // Function to run the animation loop
    const runAnimation = (currentTime: number) => {
      // Calculate how much time has passed
      const elapsed = currentTime - startTime;
      
      // Calculate progress as a value between 0 and 1
      const rawProgress = Math.min(elapsed / duration, 1);
      
      // Apply easing function if provided
      const easedProgress = easing(rawProgress);
      
      // Update state with new progress
      setProgress(easedProgress);
      
      // Continue the animation if not complete
      if (rawProgress < 1) {
        animationFrameId = requestAnimationFrame(runAnimation);
      } else {
        // Animation is complete
        setIsRunning(false);
        onComplete?.();
      }
    };
    
    // Start animation after delay
    if (delay) {
      delayTimeout = setTimeout(() => {
        startTime = performance.now();
        animationFrameId = requestAnimationFrame(runAnimation);
      }, delay);
    } else {
      animationFrameId = requestAnimationFrame(runAnimation);
    }
    
    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (delayTimeout) {
        clearTimeout(delayTimeout);
      }
    };
  }, [duration, delay, easing, onComplete]);
  
  // Reset animation
  const reset = useCallback(() => {
    setProgress(0);
    setIsRunning(false);
  }, []);
  
  return { progress, isRunning, animate, reset };
}

// Common easing functions
export const easingFunctions = {
  // Linear (no easing)
  linear: (t: number) => t,
  
  // Quadratic
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  // Cubic
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  // Elastic
  easeOutElastic: (t: number) => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  }
};

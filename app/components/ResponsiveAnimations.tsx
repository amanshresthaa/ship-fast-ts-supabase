"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useResponsive } from '../hooks/useResponsive';

// Animation configuration based on device capabilities
const getAnimationConfig = (isMobile: boolean, isTablet: boolean, prefersReducedMotion: boolean) => {
  if (prefersReducedMotion) {
    return {
      duration: 0,
      easing: 'linear',
      stagger: 0,
      enableParallax: false,
      enableGestures: false
    };
  }

  if (isMobile) {
    return {
      duration: 200,
      easing: 'ease-out',
      stagger: 50,
      enableParallax: false,
      enableGestures: true
    };
  }

  if (isTablet) {
    return {
      duration: 300,
      easing: 'ease-out',
      stagger: 75,
      enableParallax: true,
      enableGestures: true
    };
  }

  return {
    duration: 400,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    stagger: 100,
    enableParallax: true,
    enableGestures: true
  };
};

// Custom hooks for animations
export const useResponsiveAnimation = () => {
  const { isMobile, isTablet } = useResponsive();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return getAnimationConfig(isMobile, isTablet, prefersReducedMotion);
};

// Intersection Observer hook for scroll animations
export const useScrollAnimation = (
  options: { threshold?: number; rootMargin?: string } = { threshold: 0.1, rootMargin: '0px' }
) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const animationConfig = useResponsiveAnimation();

  useEffect(() => {
    const element = elementRef.current;
    if (!element || animationConfig.duration === 0) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(element);
      }
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options, animationConfig.duration]);

  return { elementRef, isVisible, animationConfig };
};

// Staggered children animation hook
export const useStaggeredAnimation = (childCount: number, delay = 0) => {
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());
  const animationConfig = useResponsiveAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animationConfig.duration === 0) {
      setVisibleIndices(new Set(Array.from({ length: childCount }, (_, i) => i)));
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let currentIndex = 0;
        const interval = setInterval(() => {
          if (currentIndex < childCount) {
            setVisibleIndices(prev => new Set([...prev, currentIndex]));
            currentIndex++;
          } else {
            clearInterval(interval);
          }
        }, animationConfig.stagger);

        observer.unobserve(entry.target);
        return () => clearInterval(interval);
      }
    }, { threshold: 0.1 });

    const element = containerRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [childCount, animationConfig.stagger, animationConfig.duration]);

  return { containerRef, visibleIndices, animationConfig };
};

// Parallax hook for desktop devices
export const useParallax = (speed = 0.5, enabled = true) => {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const animationConfig = useResponsiveAnimation();

  useEffect(() => {
    if (!enabled || !animationConfig.enableParallax || animationConfig.duration === 0) {
      return;
    }

    const handleScroll = () => {
      const element = elementRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const scrolled = window.pageYOffset;
      const parallax = scrolled * speed;
      
      setOffset(parallax);
    };

    // Throttle scroll events for performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, [speed, enabled, animationConfig.enableParallax, animationConfig.duration]);

  return { elementRef, offset };
};

// Gesture handling hook for touch devices
export const useGestures = () => {
  const [gesture, setGesture] = useState<{
    type: 'swipe' | 'pinch' | null;
    direction?: 'left' | 'right' | 'up' | 'down';
    scale?: number;
  }>({ type: null });
  
  const elementRef = useRef<HTMLDivElement>(null);
  const animationConfig = useResponsiveAnimation();

  useEffect(() => {
    if (!animationConfig.enableGestures) return;

    const element = elementRef.current;
    if (!element) return;

    let startX = 0, startY = 0, startDistance = 0;
    let isSwipe = false, isPinch = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwipe = true;
      } else if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        startDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        isPinch = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      
      if (isSwipe && e.touches.length === 1) {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = startX - currentX;
        const diffY = startY - currentY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
          setGesture({
            type: 'swipe',
            direction: diffX > 0 ? 'left' : 'right'
          });
        } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 50) {
          setGesture({
            type: 'swipe',
            direction: diffY > 0 ? 'up' : 'down'
          });
        }
      } else if (isPinch && e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        const scale = currentDistance / startDistance;
        
        setGesture({
          type: 'pinch',
          scale
        });
      }
    };

    const handleTouchEnd = () => {
      isSwipe = false;
      isPinch = false;
      setTimeout(() => setGesture({ type: null }), 300);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [animationConfig.enableGestures]);

  return { elementRef, gesture };
};

// Performance monitoring hook
export const useAnimationPerformance = () => {
  const [metrics, setMetrics] = useState({
    fps: 60,
    frameDrops: 0,
    isSmooth: true
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let frameDrops = 0;

    const measurePerformance = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime > 16.67 * 2) { // More than 2 frames at 60fps
        frameDrops++;
      }
      
      frameCount++;
      
      if (frameCount % 60 === 0) { // Update every 60 frames
        const fps = Math.round(1000 / (deltaTime / 60));
        const isSmooth = fps >= 55; // Consider smooth if above 55fps
        
        setMetrics({
          fps,
          frameDrops,
          isSmooth
        });
      }
      
      lastTime = currentTime;
      requestAnimationFrame(measurePerformance);
    };

    const animationId = requestAnimationFrame(measurePerformance);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return metrics;
};

// Animation utility components
interface AnimatedElementProps {
  children: React.ReactNode;
  animation?: 'fadeIn' | 'slideUp' | 'slideIn' | 'scale' | 'rotate';
  delay?: number;
  className?: string;
}

export const AnimatedElement: React.FC<AnimatedElementProps> = ({
  children,
  animation = 'fadeIn',
  delay = 0,
  className = ''
}) => {
  const { elementRef, isVisible, animationConfig } = useScrollAnimation();
  
  const getAnimationClasses = () => {
    if (animationConfig.duration === 0) return '';
    
    const base = `transition-all ease-out`;
    const duration = `duration-${animationConfig.duration}`;
    
    if (!isVisible) {
      switch (animation) {
        case 'fadeIn':
          return `${base} ${duration} opacity-0`;
        case 'slideUp':
          return `${base} ${duration} opacity-0 translate-y-8`;
        case 'slideIn':
          return `${base} ${duration} opacity-0 translate-x-8`;
        case 'scale':
          return `${base} ${duration} opacity-0 scale-95`;
        case 'rotate':
          return `${base} ${duration} opacity-0 rotate-12`;
        default:
          return `${base} ${duration} opacity-0`;
      }
    }
    
    return `${base} ${duration} opacity-100 translate-y-0 translate-x-0 scale-100 rotate-0`;
  };

  const style = delay > 0 ? { transitionDelay: `${delay}ms` } : {};

  return (
    <div
      ref={elementRef}
      className={`${getAnimationClasses()} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

interface StaggeredContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const StaggeredContainer: React.FC<StaggeredContainerProps> = ({
  children,
  staggerDelay,
  className = ''
}) => {
  const childArray = React.Children.toArray(children);
  const { containerRef, visibleIndices, animationConfig } = useStaggeredAnimation(
    childArray.length,
    staggerDelay
  );

  return (
    <div ref={containerRef} className={className}>
      {childArray.map((child, index) => (
        <div
          key={index}
          className={`
            transition-all duration-${animationConfig.duration} ease-out
            ${visibleIndices.has(index) 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4'
            }
          `}
          style={{
            transitionDelay: visibleIndices.has(index) 
              ? `${index * (staggerDelay || animationConfig.stagger)}ms` 
              : '0ms'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

interface ParallaxContainerProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export const ParallaxContainer: React.FC<ParallaxContainerProps> = ({
  children,
  speed = 0.5,
  className = ''
}) => {
  const { elementRef, offset } = useParallax(speed);

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        transform: `translateY(${offset}px)`,
        willChange: 'transform'
      }}
    >
      {children}
    </div>
  );
};

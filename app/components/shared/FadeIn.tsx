'use client';

import React, { useEffect, memo } from 'react';
import useAnimationFrame, { easingFunctions } from '../../hooks/useAnimationFrame';

interface FadeInProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
  easing?: keyof typeof easingFunctions;
  threshold?: number; // IntersectionObserver threshold
}

/**
 * A component that animates its children with a fade-in effect
 * Uses requestAnimationFrame for smooth animations and IntersectionObserver for triggering
 */
const FadeIn = memo(({
  children,
  duration = 500,
  delay = 0,
  className = '',
  easing = 'easeOutCubic',
  threshold = 0.1
}: FadeInProps) => {
  const { progress, animate, reset } = useAnimationFrame({
    duration,
    delay,
    easing: easingFunctions[easing]
  });

  const ref = React.useRef<HTMLDivElement>(null);
  const observerRef = React.useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Create intersection observer to trigger animation when element is in view
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate();
            // Disconnect after triggering animation once
            observerRef.current?.disconnect();
          }
        });
      },
      { threshold }
    );

    observerRef.current.observe(ref.current);

    return () => {
      observerRef.current?.disconnect();
      reset();
    };
  }, [animate, reset, threshold]);

  // Calculate opacity based on animation progress
  const opacity = progress;
  
  // Calculate transform based on animation progress
  const transform = `translateY(${(1 - progress) * 20}px)`;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity,
        transform,
        transition: `opacity ${duration}ms, transform ${duration}ms`,
        willChange: 'opacity, transform'
      }}
    >
      {children}
    </div>
  );
});

FadeIn.displayName = 'FadeIn';

export default FadeIn;

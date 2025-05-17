'use client';

import React, { useState, useCallback, memo } from 'react';
import Image from 'next/image';
import useIntersectionObserver from '@/app/hooks/useIntersectionObserver';

interface LazyImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
}

/**
 * LazyImage - A component that only loads images when they're about to enter the viewport
 * Implements efficient image loading from performance checklist
 * Optimized with memo and loading state management
 */
const LazyImage: React.FC<LazyImageProps> = memo(({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality,
  sizes,
  placeholder,
  blurDataURL,
  onLoad,
}) => {
  // Track if image has loaded successfully
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  
  // Use our intersection observer hook with optimized settings
  // Images will only start loading when they're close to entering the viewport
  // freezeOnceVisible ensures we don't stop loading if image scrolls out of view
  const [ref, isInView] = useIntersectionObserver<HTMLDivElement>({
    rootMargin: '300px', // Increased to start loading when image is 300px from viewport for better UX
    threshold: 0.1,      // Start loading when at least 10% of the element is visible
    freezeOnceVisible: true, // Once we start loading, don't stop
    initialInView: priority, // If priority is true, treat as initially in view
    skipObserver: priority,  // Skip the observer if priority is true
  });

  // Handle image load event
  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  }, [onLoad]);

  // Handle image error
  const handleImageError = useCallback(() => {
    setIsError(true);
  }, []);
  
  return (
    <div 
      ref={ref} 
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {(isInView || priority) && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          priority={priority}
          quality={quality || 80} // Set a default quality value
          sizes={sizes}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
      
      {/* Show placeholder until image is loaded or if there's an error */}
      {(!isInView || !isLoaded) && !priority && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Show error state if image failed to load */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          <span className="text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
});

// Add display name for debugging
LazyImage.displayName = 'LazyImage'; 

export default LazyImage;

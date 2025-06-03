'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { useResponsive } from '@/app/hooks/useResponsive';

interface ResponsiveImageSourceProps {
  mobile?: string;
  mobileLarge?: string;
  tablet?: string;
  desktop?: string;
  desktopLarge?: string;
  desktopXl?: string;
}

interface OptimizedResponsiveImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  alt: string;
  sources?: ResponsiveImageSourceProps;
  quality?: number;
  loading?: 'lazy' | 'eager';
  blurDataURL?: string;
  placeholder?: 'blur' | 'empty';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  aspectRatio?: string;
  backgroundBlur?: boolean;
  fallbackSrc?: string;
}

/**
 * Optimized responsive image component with device-specific sources
 * Features:
 * - Device-specific image sources for optimal loading
 * - Automatic quality optimization based on device
 * - Progressive loading with blur placeholder
 * - Fallback handling for failed image loads
 * - Aspect ratio maintenance
 * - Performance monitoring
 */
export const OptimizedResponsiveImage: React.FC<OptimizedResponsiveImageProps> = ({
  src,
  alt,
  sources,
  quality,
  loading = 'lazy',
  blurDataURL,
  placeholder = 'blur',
  objectFit = 'cover',
  aspectRatio,
  backgroundBlur = false,
  fallbackSrc,
  className = '',
  ...props
}) => {
  const { deviceType, width, isTouchDevice, isBreakpointDown } = useResponsive();
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loadTime, setLoadTime] = useState<number | null>(null);

  // Determine optimal image source based on device
  const getOptimalImageSrc = () => {
    if (!sources) return src;

    switch (deviceType) {
      case 'mobile':
        return sources.mobile || src;
      case 'mobile-large':
        return sources.mobileLarge || sources.mobile || src;
      case 'tablet':
        return sources.tablet || sources.mobileLarge || src;
      case 'desktop':
        return sources.desktop || sources.tablet || src;
      case 'desktop-large':
        return sources.desktopLarge || sources.desktop || src;
      case 'desktop-xl':
        return sources.desktopXl || sources.desktopLarge || src;
      default:
        return src;
    }
  };

  // Determine optimal quality based on device and connection
  const getOptimalQuality = (): number => {
    if (quality) return quality;

    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType;
    
    // Base quality on device type and connection
    let baseQuality = 85; // Default high quality

    // Reduce quality for mobile devices
    if (deviceType === 'mobile' || deviceType === 'mobile-large') {
      baseQuality = 75;
    }

    // Further reduce quality for slow connections
    if (effectiveType) {
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          baseQuality = Math.min(baseQuality - 30, 50);
          break;
        case '3g':
          baseQuality = Math.min(baseQuality - 15, 70);
          break;
        case '4g':
          // Keep base quality
          break;
      }
    }

    return baseQuality;
  };

  // Generate appropriate sizes attribute
  const getSizesAttribute = (): string => {
    if (props.sizes) return props.sizes;
    
    // Default responsive sizes based on common layouts
    return '(max-width: 576px) 100vw, (max-width: 768px) 50vw, (max-width: 992px) 33vw, 25vw';
  };

  // Handle image loading
  useEffect(() => {
    const optimalSrc = getOptimalImageSrc();
    if (optimalSrc !== imageSrc) {
      setImageSrc(optimalSrc);
      setImageLoaded(false);
      setImageError(false);
    }
  }, [deviceType, sources]);

  // Track image load performance
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    
    if (typeof window !== 'undefined' && window.performance) {
      const loadEndTime = performance.now();
      setLoadTime(loadEndTime);
    }
  };

  const handleImageError = () => {
    setImageError(true);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
  };

  // Generate blur data URL if not provided
  const generateBlurDataURL = () => {
    if (blurDataURL) return blurDataURL;
    
    // Simple base64 encoded SVG blur placeholder
    const svg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" className="fill-custom-gray-f0"/>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  // Container styles with aspect ratio
  const containerStyles: React.CSSProperties = {
    ...(aspectRatio && { aspectRatio }),
    position: 'relative',
    overflow: 'hidden',
  };

  // Image wrapper styles for effects
  const imageWrapperStyles: React.CSSProperties = {
    transition: 'opacity 0.3s ease-in-out',
    opacity: imageLoaded ? 1 : 0.8,
    ...(backgroundBlur && !imageLoaded && {
      filter: 'blur(5px)',
      transform: 'scale(1.1)', // Prevent blur edge artifacts
    }),
  };

  const imageProps: ImageProps = {
    src: imageSrc,
    alt,
    quality: getOptimalQuality(),
    loading,
    sizes: getSizesAttribute(),
    placeholder: placeholder === 'blur' ? 'blur' : 'empty',
    blurDataURL: placeholder === 'blur' ? generateBlurDataURL() : undefined,
    onLoad: handleImageLoad,
    onError: handleImageError,
    style: {
      objectFit,
      width: '100%',
      height: '100%',
    },
    className: `responsive-image ${className}`,
    ...props,
  };

  return (
    <div style={containerStyles} className="responsive-image-container">
      <div style={imageWrapperStyles}>
        <Image {...imageProps} />
      </div>
      
      {/* Loading indicator for slow connections */}
      {!imageLoaded && !imageError && loading === 'lazy' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-pulse bg-gray-300 rounded w-8 h-8"></div>
        </div>
      )}
      
      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-gray-500 text-sm text-center p-4">
            <div className="mb-2">📷</div>
            <div>Image failed to load</div>
          </div>
        </div>
      )}
      
      {/* Performance indicator (dev mode only) */}
      {process.env.NODE_ENV === 'development' && loadTime && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {Math.round(loadTime)}ms
        </div>
      )}
    </div>
  );
};

interface LazyImageGridProps {
  images: Array<{
    id: string;
    src: string;
    alt: string;
    sources?: ResponsiveImageSourceProps;
  }>;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: string;
  aspectRatio?: string;
}

/**
 * Optimized image grid with responsive layout and lazy loading
 */
export const LazyImageGrid: React.FC<LazyImageGridProps> = ({
  images,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'gap-4',
  aspectRatio = '16/9',
}) => {
  const { deviceType } = useResponsive();
  
  const getColumnCount = () => {
    switch (deviceType) {
      case 'mobile':
      case 'mobile-large':
        return columns.mobile || 1;
      case 'tablet':
        return columns.tablet || 2;
      case 'desktop':
      case 'desktop-large':
      case 'desktop-xl':
        return columns.desktop || 3;
      default:
        return 2;
    }
  };

  const gridClasses = `grid grid-cols-${getColumnCount()} ${gap}`;

  return (
    <div className={gridClasses}>
      {images.map((image, index) => (
        <OptimizedResponsiveImage
          key={image.id}
          src={image.src}
          alt={image.alt}
          sources={image.sources}
          aspectRatio={aspectRatio}
          loading={index < 4 ? 'eager' : 'lazy'} // Load first 4 images eagerly
          placeholder="blur"
          className="w-full h-full object-cover rounded-lg"
        />
      ))}
    </div>
  );
};

/**
 * Hook for image preloading with device-specific optimization
 */
export const useImagePreloader = (images: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const { deviceType } = useResponsive();

  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (loadedImages.has(src)) {
        resolve();
        return;
      }

      setLoadingImages(prev => new Set(prev).add(src));

      const img = document.createElement('img');
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(src));
        setLoadingImages(prev => {
          const next = new Set(prev);
          next.delete(src);
          return next;
        });
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  const preloadImages = async (imagesToPreload: string[] = images) => {
    // Limit preloading on mobile devices to save bandwidth
    const maxPreload = deviceType === 'mobile' || deviceType === 'mobile-large' ? 3 : 6;
    const limitedImages = imagesToPreload.slice(0, maxPreload);

    try {
      await Promise.all(limitedImages.map(preloadImage));
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    }
  };

  return {
    preloadImages,
    loadedImages,
    loadingImages,
    isImageLoaded: (src: string) => loadedImages.has(src),
    isImageLoading: (src: string) => loadingImages.has(src),
  };
};

export default OptimizedResponsiveImage;

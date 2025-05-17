'use client';

import { useEffect, useState } from 'react';

/**
 * Font loading status
 */
type FontStatus = 'loading' | 'loaded' | 'error';

/**
 * Interface for the font loader options
 */
interface FontOptions {
  weight?: string | number;
  style?: 'normal' | 'italic' | 'oblique';
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  preload?: boolean;
}

/**
 * Font cache to track which fonts are already loaded/loading
 */
const fontCache = new Map<string, FontStatus>();

/**
 * Create a unique key for a font configuration
 */
function getFontKey(family: string, options: FontOptions = {}): string {
  const { weight = 400, style = 'normal' } = options;
  return `${family}-${weight}-${style}`;
}

/**
 * Load a font using the CSS Font Loading API with fallback for older browsers
 */
export async function loadFont(
  family: string, 
  options: FontOptions = {}
): Promise<boolean> {
  const { 
    weight = 400, 
    style = 'normal', 
    display = 'swap'
  } = options;
  
  const fontKey = getFontKey(family, options);
  
  // Return immediately if already loaded
  if (fontCache.get(fontKey) === 'loaded') {
    return true;
  }
  
  // Skip if we're in SSR
  if (typeof document === 'undefined') {
    return false;
  }
  
  fontCache.set(fontKey, 'loading');
  
  try {
    // Try using Font Face Observer API if available
    if ('FontFace' in window) {
      const font = new FontFace(
        family, 
        `url(${encodeURIComponent(family)})`, 
        { weight: String(weight), style, display }
      );
      
      // Add to document fonts
      const loadedFace = await font.load();
      document.fonts.add(loadedFace);
      fontCache.set(fontKey, 'loaded');
      return true;
    }
    
    // Fallback method for older browsers
    return new Promise((resolve) => {
      const sampleText = 'BESbwy';
      
      // Create test elements
      const container = document.createElement('div');
      const fallbackSpan = document.createElement('span');
      const testSpan = document.createElement('span');
      
      Object.assign(container.style, {
        position: 'absolute',
        visibility: 'hidden',
        top: '-10000px',
        left: '-10000px',
        width: 'auto',
        height: 'auto',
        whiteSpace: 'nowrap'
      });
      
      // Set styles
      const baseStyle = {
        fontWeight: String(weight),
        fontStyle: style,
        fontSize: '100px',
        position: 'absolute'
      };
      
      Object.assign(fallbackSpan.style, {
        ...baseStyle,
        fontFamily: 'serif' // Fallback font
      });
      
      Object.assign(testSpan.style, {
        ...baseStyle,
        fontFamily: `"${family}", serif`
      });
      
      fallbackSpan.textContent = sampleText;
      testSpan.textContent = sampleText;
      
      container.appendChild(fallbackSpan);
      container.appendChild(testSpan);
      document.body.appendChild(container);
      
      // Compare widths after a timeout
      setTimeout(() => {
        const fallbackWidth = fallbackSpan.offsetWidth;
        const testWidth = testSpan.offsetWidth;
        
        const isLoaded = fallbackWidth !== testWidth;
        fontCache.set(fontKey, isLoaded ? 'loaded' : 'error');
        
        document.body.removeChild(container);
        resolve(isLoaded);
      }, 50);
    });
  } catch (err) {
    console.error(`Failed to load font ${family}:`, err);
    fontCache.set(fontKey, 'error');
    return false;
  }
}

/**
 * Preload a font
 */
export function preloadFont(
  family: string, 
  options: FontOptions = {}
): void {
  const { weight = 400, style = 'normal' } = options;
  
  // Skip if we're in SSR
  if (typeof document === 'undefined') return;
  
  const fontKey = getFontKey(family, options);
  
  // Skip if already loaded/loading
  if (fontCache.has(fontKey)) return;
  
  // Add preload link
  const preloadLink = document.createElement('link');
  preloadLink.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  preloadLink.rel = 'preload';
  preloadLink.as = 'style';
  preloadLink.type = 'text/css';
  
  document.head.appendChild(preloadLink);
  
  // Also trigger actual loading
  loadFont(family, options).catch(console.error);
}

/**
 * React hook for font loading
 */
export function useFontLoading(
  family: string, 
  options: FontOptions = {}
): FontStatus {
  const fontKey = getFontKey(family, options);
  const [status, setStatus] = useState<FontStatus>(
    fontCache.get(fontKey) || 'loading'
  );
  
  useEffect(() => {
    // Skip if already loaded
    if (status === 'loaded') return;
    
    // Start loading the font
    loadFont(family, options)
      .then((success) => {
        setStatus(success ? 'loaded' : 'error');
      })
      .catch(() => {
        setStatus('error');
      });
      
  }, [family, options, status]);
  
  return status;
}

/**
 * Get font loading status
 */
export function getFontStatus(
  family: string, 
  options: FontOptions = {}
): FontStatus {
  const fontKey = getFontKey(family, options);
  return fontCache.get(fontKey) || 'loading';
}

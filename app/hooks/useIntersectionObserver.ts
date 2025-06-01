// app/hooks/useIntersectionObserver.ts
import { useState, useEffect, useRef, useCallback } from 'react';

interface IntersectionOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
  initialInView?: boolean; // New option to set initial state for SSR
  skipObserver?: boolean; // Option to skip observer (for testing or force values)
  observerOnce?: boolean; // Only trigger once and then disconnect
}

/**
 * React hook that detects when a DOM element enters or leaves the viewport using the Intersection Observer API.
 *
 * Returns a tuple containing a ref to attach to the target element, a boolean indicating if the element is in view, and the latest IntersectionObserverEntry.
 *
 * @param options - Configuration object extending IntersectionObserverInit, with additional flags:
 *   - `freezeOnceVisible`: If true, freezes the visibility state after the element becomes visible.
 *   - `initialInView`: Sets the initial visibility state, useful for server-side rendering.
 *   - `skipObserver`: If true, disables observation (useful for testing).
 *   - `observerOnce`: If true, disconnects the observer after the element is first visible.
 * @returns A readonly tuple: [ref, isInView, entry], where `ref` is attached to the observed element, `isInView` indicates visibility, and `entry` contains intersection details or null.
 *
 * @remark If `freezeOnceVisible` is enabled, the hook will stop updating visibility state after the element is first observed as visible.
 */
function useIntersectionObserver<T extends Element>({
  threshold = 0,
  root = null, 
  rootMargin = '0%',
  freezeOnceVisible = false,
  initialInView = false, // Default for SSR is false
  skipObserver = false, // Default is to use the observer
  observerOnce = false  // Default is to keep observing
}: IntersectionOptions = {}) {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isInView, setIsInView] = useState(initialInView);
  const elementRef = useRef<T | null>(null);
  
  // Store frozen state in a ref to avoid re-creating the observer
  const frozen = useRef<boolean>(false);
  const observer = useRef<IntersectionObserver | null>(null);
  
  const updateEntry = useCallback(([e]: IntersectionObserverEntry[]): void => {
    setEntry(e);
    
    // Update frozen state if needed
    if (e.isIntersecting && freezeOnceVisible) {
      frozen.current = true;
      
      // If we only need to observe once, disconnect after it's in view
      if (observerOnce && observer.current) {
        observer.current.disconnect();
      }
    }
    
    // Update the isInView state
    setIsInView(e.isIntersecting || frozen.current);
  }, [freezeOnceVisible, observerOnce]);
  
  useEffect(() => {
    // Skip if told to or missing browser API
    if (skipObserver || typeof IntersectionObserver !== 'function') {
      return;
    }
    
    const node = elementRef.current;
    
    // Don't observe if element doesn't exist or if frozen and already seen
    if (!node || (freezeOnceVisible && frozen.current)) {
      return;
    }
    
    // Cleanup any existing observer
    if (observer.current) {
      observer.current.disconnect();
    }
    
    // Create the observer with memoized update function
    observer.current = new IntersectionObserver(
      updateEntry, 
      { threshold, root, rootMargin }
    );
    
    // Start observing
    observer.current.observe(node);
    
    // Clean up when component unmounts or deps change
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [threshold, root, rootMargin, freezeOnceVisible, skipObserver, updateEntry]);
  
  return [elementRef, isInView, entry] as const;
}

export default useIntersectionObserver;

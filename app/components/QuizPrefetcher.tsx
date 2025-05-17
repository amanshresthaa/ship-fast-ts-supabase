'use client';

import { useCallback, useEffect, useMemo, useRef, memo } from 'react';
import { prefetchQuiz } from '../hooks/useQuizSWR';
import useNetwork from '../hooks/useNetwork';

interface QuizPrefetcherProps {
  relatedQuizIds: string[];
  currentQuizId?: string;
  prefetchDistance?: number;
  enabled?: boolean;
  prefetchPriority?: 'high' | 'low' | 'auto'; // New prop to control prefetching priority
}

/**
 * QuizPrefetcher component - Optimized version
 * This component prefetches related quiz data when the user is idle,
 * improving perceived performance when users navigate between quizzes.
 * 
 * Optimizations:
 * - Memoized filtering of quiz IDs
 * - Enhanced idle callback handling with priority
 * - Connection-aware prefetching using Network Information API
 * - Throttled prefetching to prevent network congestion
 * - Prefetching tracking to avoid duplicate requests
 */
const QuizPrefetcher = memo(({
  relatedQuizIds,
  currentQuizId,
  prefetchDistance = 400, // Default distance in pixels to start prefetching
  enabled = true,
  prefetchPriority = 'auto'
}: QuizPrefetcherProps) => {
  // Track which quizzes have been prefetched to avoid duplicates
  const prefetchedQuizIds = useRef<Set<string>>(new Set());
  
  // Track if the component is mounted
  const isMounted = useRef<boolean>(true);

  // Don't prefetch if disabled or no related quizzes
  if (!enabled || !relatedQuizIds.length) return null;
  
  // Filter out current quiz from related quizzes - memoized for performance
  const quizzesToPrefetch = useMemo(() => 
    currentQuizId
      ? relatedQuizIds.filter(id => id !== currentQuizId && !prefetchedQuizIds.current.has(id))
      : relatedQuizIds.filter(id => !prefetchedQuizIds.current.has(id)),
    [relatedQuizIds, currentQuizId]
  );
  
  // Use our custom network hook to detect connection status
  const network = useNetwork();
  
  // Determine if we should prefetch based on network conditions
  const shouldPrefetch = useCallback(() => {
    // Don't prefetch if offline
    if (!network.online) return false;
    
    // Don't prefetch when data saver is enabled
    if (network.saveData) return false;
    
    // Don't prefetch on slow connections unless high priority
    if (network.isSlow && prefetchPriority !== 'high') return false;
    
    // On 3G connection, only prefetch high or auto priority
    if (network.effectiveConnectionType === '3g' && prefetchPriority === 'low') return false;
    
    return true;
  }, [network.online, network.saveData, network.isSlow, network.effectiveConnectionType, prefetchPriority]);
  
  // Perform the actual prefetch with tracking
  const performPrefetch = useCallback((quizId: string) => {
    if (!prefetchedQuizIds.current.has(quizId)) {
      prefetchQuiz(quizId);
      prefetchedQuizIds.current.add(quizId);
    }
  }, []);
  
  // Prefetch when the user is idle, with throttling
  const prefetchWhenIdle = useCallback(() => {
    if (typeof window === 'undefined' || !enabled || !quizzesToPrefetch.length || !shouldPrefetch()) return;
    
    // Use requestIdleCallback if available, or setTimeout as a fallback
    const requestIdleCallback = 
      window.requestIdleCallback || 
      ((cb) => setTimeout(cb, 1000));
    
    // Schedule prefetching during idle time
    requestIdleCallback(() => {
      if (!isMounted.current) return;
      
      // Limit number of prefetches to avoid bandwidth issues
      const batchSize = 2;
      const quizzesToLoad = quizzesToPrefetch.slice(0, batchSize);
      
      // Stagger the prefetching to avoid network congestion
      quizzesToLoad.forEach((quizId, index) => {
        setTimeout(() => {
          if (isMounted.current) {
            performPrefetch(quizId);
          }
        }, index * 300); // 300ms delay between each prefetch
      });
    }, { timeout: 2000 }); // 2 second timeout for idle callback
  }, [quizzesToPrefetch, enabled, shouldPrefetch, performPrefetch]);
  
  // Prefetch when elements are near viewport
  const setupIntersectionObserver = useCallback(() => {
    if (typeof window === 'undefined' || !enabled || !shouldPrefetch()) return;
    
    // Create targets for each related quiz
    const prefetchTargets = document.querySelectorAll('[data-prefetch-quiz-id]');
    
    if (!prefetchTargets.length) return;
    
    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const quizId = entry.target.getAttribute('data-prefetch-quiz-id');
            if (quizId) {
              performPrefetch(quizId);
              // Unobserve after prefetching
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { 
        rootMargin: `0px 0px ${prefetchDistance}px 0px`, // Start prefetching before elements enter viewport
        threshold: 0.1 // Start when 10% of the element is visible
      }
    );
    
    // Observe all prefetch targets
    prefetchTargets.forEach((target) => {
      observer.observe(target);
    });
    
    return () => observer.disconnect();
  }, [prefetchDistance, enabled, shouldPrefetch, performPrefetch]);
  
  useEffect(() => {
    // Initial prefetch when idle
    prefetchWhenIdle();
    
    // Set up intersection observer for scroll-based prefetching
    const cleanup = setupIntersectionObserver();
    
    return () => {
      isMounted.current = false;
      cleanup?.();
    };
  }, [prefetchWhenIdle, setupIntersectionObserver]);
  
  // This component doesn't render anything
  return null;
});

QuizPrefetcher.displayName = 'QuizPrefetcher';
export default QuizPrefetcher;

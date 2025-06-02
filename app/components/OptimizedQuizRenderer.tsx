'use client';

import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useQuizSWR } from '../hooks/useQuizSWR';
import QuizPrefetcher from './QuizPrefetcher';
import dynamic from 'next/dynamic';
import { Card, LoadingSpinner, Button, FadeIn, ErrorBoundary, RefreshIcon, LoadingIcon, InfoIcon } from './shared';
import { MemoWithName, createPropsComparator } from '../utils/memoHelpers';
import { twMerge, tw } from '../utils/tw';
import useRenderMetrics from '../hooks/useRenderMetrics';
import useNetwork from '../hooks/useNetwork';

interface OptimizedQuizRendererProps {
  quizId: string;
  initialData?: any;
  relatedQuizIds?: string[];
}

/**
 * OptimizedQuizRenderer Component (Enhanced version)
 * This component showcases all performance optimizations:
 * - Server-side rendering with initial data
 * - SWR for client-side data fetching with stale-while-revalidate
 * - Background prefetching for related quizzes with smart prioritization
 * - React.memo and useMemo for optimized rendering
 * - Deferred non-critical content loading
 * - Redis cache integration (in production)
 * - Performance metrics tracking
 * - Network-aware rendering
 */
const OptimizedQuizRenderer = ({
  quizId,
  initialData,
  relatedQuizIds = []
}: OptimizedQuizRendererProps) => {
  // Track component performance in development
  useRenderMetrics('OptimizedQuizRenderer');
  // Track render type for demonstration
  const [renderType, setRenderType] = useState<'ssr' | 'swr' | 'cache'>('ssr');
  
  // Get network status to optimize data loading
  const network = useNetwork();

  // Use SWR for client-side data fetching with optimized config based on network conditions
  const { data: quiz, error, isLoading, mutate } = useQuizSWR(quizId, undefined, {
    fallbackData: initialData,                                // Use server-rendered data as initial data
    revalidateOnFocus: false,                                 // Don't revalidate on window focus
    dedupingInterval: network.isSlow ? 30000 : 10000,         // Longer dedupe interval on slow networks
    keepPreviousData: true,                                   // Keep showing previous data while loading new data
    revalidateOnReconnect: !network.saveData,                 // Don't auto-revalidate in data saving mode
    errorRetryCount: network.online ? 3 : 0,                  // Don't retry on offline
    errorRetryInterval: network.isSlow ? 10000 : 5000,        // Longer retry interval on slow networks
    focusThrottleInterval: 10000                              // Throttle focus events
  });
  
  // Track if this is the first render with a more efficient approach
  useEffect(() => {
    // If we have initial data, it's SSR, else it's a client-side fetch
    setRenderType(initialData ? 'ssr' : 'swr');
    
    // After hydration, mark subsequent renders as from cache
    // Use requestAnimationFrame for better performance than setTimeout
    let isMounted = true;
    requestAnimationFrame(() => {
      if (isMounted) {
        // Wait for one more frame to ensure hydration is complete
        requestAnimationFrame(() => {
          if (isMounted) {
            setRenderType('cache');
          }
        });
      }
    });
    
    return () => {
      isMounted = false;
    };
  }, [initialData]);
  
  // Handle errors and loading states
  if (error) {
    return (
      <Card elevation="low" className="bg-red-50 border-red-200">
        <h3 className="text-red-700 font-medium">Error loading quiz</h3>
        <p className="text-red-600 mt-1">{error.message}</p>
        <Button 
          variant="outline" 
          className="mt-3" 
          onClick={() => mutate()}
          iconLeft={<RefreshIcon />}
        >
          Try Again
        </Button>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
      <Card padding="medium" elevation="low" className="animate-pulse space-y-4">
        <div className="flex justify-center items-center py-4">
          <LoadingSpinner size="large" color="primary" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </Card>
    );
  }
  
  if (!quiz) {
    return (
      <Card elevation="low" className="bg-yellow-50 border-yellow-200">
        <h3 className="text-yellow-700 font-medium">Quiz not found</h3>
        <p className="text-yellow-600 mt-1">The requested quiz could not be found.</p>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <Card elevation="medium" className="overflow-hidden" padding="none">
        {/* Debug info - remove in production */}
        <div className="bg-gray-100 px-4 py-2 text-xs font-mono flex justify-between items-center">
          <span className="flex items-center gap-1">
            <InfoIcon size={12} />
            Render: {renderType}
          </span>
          <Button 
            variant="primary" 
            size="small" 
            onClick={() => mutate()}
            iconLeft={<RefreshIcon size={12} />}
          >
            Refresh
          </Button>
        </div>
        
        {/* Quiz header */}
        <FadeIn duration={400} delay={200} className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">{quiz.title}</h1>
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              {quiz.difficulty}
            </span>
            <span className="ml-3">{quiz.questions.length} Questions</span>
          </div>
          {quiz.description && (
            <p className="mt-4 text-gray-700">{quiz.description}</p>
          )}
        </FadeIn>
      
        {/* Quiz questions preview */}
        <FadeIn duration={400} delay={300} className="px-6 py-4">
          <h2 className="text-lg font-semibold mb-4">Questions Preview</h2>
          <div className="space-y-4">
            {quiz.questions.slice(0, 3).map((question: any, index: number) => (
              <Card 
                key={question.id} 
                elevation="low" 
                padding="medium" 
                className={tw(
                  "hover:shadow-md transition-shadow duration-200",
                  network.saveData ? "bg-gray-50" : undefined
                )}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                  <span className={twMerge(
                    "inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10",
                    question.type.includes("multiple") ? "bg-blue-50 text-blue-700 ring-blue-700/10" : ""
                  )}>
                    {question.type.replace('_', ' ')}
                  </span>
                </div>
                <p className="mt-2 text-gray-800">{question.question}</p>
              </Card>
            ))}
            
            {quiz.questions.length > 3 && (
              <div className="text-center py-2 text-gray-500 text-sm">
                +{quiz.questions.length - 3} more questions
              </div>
            )}
          </div>
        </FadeIn>
        
        {/* Related quizzes would go here */}
        {relatedQuizIds.length > 0 && (
          <FadeIn duration={400} delay={400} className="px-6 py-4 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Related Quizzes</h2>
            <div className="grid grid-cols-2 gap-4">
              {relatedQuizIds.map((id) => (
                <Card 
                  key={id}
                  elevation="low"
                  padding="small"
                  className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                  data-prefetch-quiz-id={id} // Used by the QuizPrefetcher
                >
                  <span className="font-medium">{id}</span>
                </Card>
              ))}
            </div>
          </FadeIn>
        )}
        
        {/* Invisible prefetcher for related quizzes */}
        <QuizPrefetcher
          relatedQuizIds={relatedQuizIds}
          currentQuizId={quizId}
          enabled={true}
        />
      </Card>
    </ErrorBoundary>
  );
};

// Use our enhanced memo with proper naming and custom comparison
const EnhancedOptimizedQuizRenderer = MemoWithName(OptimizedQuizRenderer, 
  // Custom prop comparator that does deep comparison for initialData
  createPropsComparator<OptimizedQuizRendererProps>(['initialData'])
);

export default EnhancedOptimizedQuizRenderer;

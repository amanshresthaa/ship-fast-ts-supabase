import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import { Quiz } from '../types/quiz';

export type UseQuizSWRResponse = SWRResponse<Quiz | null, Error> & {
  isLoading: boolean;
}

/**
 * Custom SWR hook for fetching quiz data with Stale-While-Revalidate pattern
 * This provides optimistic UI updates with background revalidation
 * 
 * @param quizId The ID of the quiz to fetch
 * @param questionType Optional filter for question type
 * @param options SWR configuration options
 * @returns SWR response with quiz data and loading state
 */
export function useQuizSWR(
  quizId?: string,
  questionType?: string,
  options?: SWRConfiguration
): UseQuizSWRResponse {
  // Only fetch if we have a quizId
  const shouldFetch = !!quizId;
  
  // Build the API URL with optional question type filter
  const apiUrl = shouldFetch 
    ? `/api/quiz/cached/${quizId}${questionType ? `?type=${questionType}` : ''}`
    : null;

  // Set default SWR options
  const defaultOptions: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000, // 5 seconds deduplication interval
    ...options
  };
  
  // Use SWR to fetch the quiz data
  const swr = useSWR<Quiz | null, Error>(
    apiUrl,
    async (url) => {
      const res = await fetch(url);
      
      if (!res.ok) {
        // Handle specific error codes
        if (res.status === 404) {
          console.warn(`Quiz with ID '${quizId}' not found.`);
          return null;
        }
        
        // Handle other errors
        const errorData = await res.json();
        throw new Error(errorData.error || `Error fetching quiz: ${res.statusText}`);
      }
      
      return res.json();
    },
    defaultOptions
  );
  
  // Add isLoading helper
  const isLoading = shouldFetch && !swr.error && !swr.data;
  
  return {
    ...swr,
    isLoading
  };
}

/**
 * Prefetch quiz data to populate the cache
 * This can be used for preloading data for quizzes that the user might visit next
 * 
 * @param quizId The ID of the quiz to prefetch
 * @param questionType Optional filter for question type
 */
export async function prefetchQuiz(quizId: string, questionType?: string): Promise<void> {
  const apiUrl = `/api/quiz/cached/${quizId}${questionType ? `?type=${questionType}` : ''}`;
  
  try {
    // Fire and forget - we don't need to wait for the response
    fetch(apiUrl, {
      priority: 'low', // Use low priority for prefetching
      cache: 'force-cache' // Ensure we use the cache if available
    }).catch(() => {
      // Silently ignore prefetch errors
    });
    
    console.debug(`Prefetching quiz: ${quizId}`);
  } catch (error) {
    // Silently ignore prefetch errors
    console.debug(`Failed to prefetch quiz: ${quizId}`);
  }
}

import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import { Quiz } from '../types/quiz';

export type UseQuizSWRResponse = SWRResponse<Quiz | null, Error> & {
  isLoading: boolean;
}

/**
 * Fetches quiz data by quiz ID and optional question type using the SWR (Stale-While-Revalidate) pattern.
 *
 * Returns an SWR response object containing the quiz data (or `null` if not found), error state, and an `isLoading` flag indicating if the fetch is in progress.
 *
 * @param quizId - The unique identifier of the quiz to fetch.
 * @param questionType - Optional filter to fetch only questions of a specific type.
 * @param options - Optional SWR configuration to customize fetching behavior.
 * @returns An SWR response object with quiz data, error, and loading state.
 *
 * @remark Returns `null` for the quiz data if the quiz is not found (HTTP 404).
 * @throws {Error} If the fetch fails for reasons other than a missing quiz, with the error message from the API response or status text.
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
 * Initiates a background fetch to prepopulate the cache with quiz data for a given quiz ID and optional question type.
 *
 * Use this to preload quiz data that users are likely to access soon.
 *
 * @param quizId - The unique identifier of the quiz to prefetch.
 * @param questionType - Optional question type filter to limit the prefetched data.
 *
 * @remark Errors during prefetching are silently ignored and do not affect application flow.
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

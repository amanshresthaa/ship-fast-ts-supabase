'use client';

import { 
  useEffect, 
  useState, 
  createContext, 
  useContext, 
  ReactNode, 
  useCallback, 
  useMemo 
} from 'react';
import { Quiz } from '../types/quiz';

// Create a context for the quiz data
interface QuizContextType {
  quiz: Quiz | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

// Provider props interface
interface QuizDataProviderProps {
  children: ReactNode;
  quizId: string;
  initialData?: Quiz | null;
}

/**
 * Provides quiz data, loading state, error, and refetch functionality to descendant components via React context.
 *
 * Optionally accepts initial quiz data for server-side rendering or prefetching scenarios. Fetches quiz data from a cached API endpoint based on the provided {@link quizId}, managing loading and error states internally.
 *
 * @param children - React nodes to be rendered within the provider.
 * @param quizId - The unique identifier for the quiz to fetch.
 * @param initialData - Optional initial quiz data to populate the context without fetching.
 *
 * @remark
 * If {@link initialData} is provided, the provider will not fetch quiz data on mount.
 */
export function QuizDataProvider({ children, quizId, initialData }: QuizDataProviderProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuiz = useCallback(async () => {
    if (!quizId) return;
    
    setIsLoading(true);
    try {
      // Use the cached API endpoint
      const response = await fetch(`/api/quiz/cached/${quizId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quiz: ${response.statusText}`);
      }
      
      const data = await response.json();
      setQuiz(data);
    } catch (err: any) {
      console.error('Error fetching quiz data:', err);
      setError(err instanceof Error ? err : new Error(err?.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    // If we have initial data, don't fetch
    if (initialData || !quizId) return;
    
    fetchQuiz();
  }, [quizId, initialData, fetchQuiz]);

  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo(() => ({
    quiz,
    isLoading,
    error,
    refetch: fetchQuiz
  }), [quiz, isLoading, error, fetchQuiz]);

  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
}

/**
 * Retrieves the current quiz context.
 *
 * @returns The quiz context value.
 *
 * @throws {Error} If called outside of a {@link QuizDataProvider}.
 */
export function useQuizContext() {
  const context = useContext(QuizContext);
  
  if (context === undefined) {
    throw new Error('useQuizContext must be used within a QuizDataProvider');
  }
  
  return context;
}

// Selector hooks to access only specific parts of the context
/**
 * Returns the current quiz data from the quiz context.
 *
 * Use this hook to access the quiz object without causing re-renders when unrelated context values change.
 *
 * @returns The current quiz data, or null if not loaded.
 */
export function useQuizData() {
  const { quiz } = useQuizContext();
  return quiz;
}

/**
 * Returns the loading state for quiz data fetching from the quiz context.
 *
 * @returns `true` if quiz data is currently being loaded; otherwise, `false`.
 */
export function useQuizLoadingState() {
  const { isLoading } = useQuizContext();
  return isLoading;
}

/**
 * Returns the current error state from the quiz context.
 *
 * @returns The error encountered during quiz data fetching, or null if no error has occurred.
 */
export function useQuizError() {
  const { error } = useQuizContext();
  return error;
}

/**
 * Returns a function to manually refetch the quiz data from the API.
 *
 * @returns A function that triggers a reload of the quiz data when called.
 */
export function useQuizRefetch() {
  const { refetch } = useQuizContext();
  return refetch;
}

/**
 * Returns the complete quiz context object, including quiz data, loading state, error, and refetch function.
 *
 * Use this hook when you need access to all quiz-related state and actions provided by the context.
 *
 * @returns The full quiz context value.
 */
export function useFullQuizContext() {
  return useQuizContext();
}

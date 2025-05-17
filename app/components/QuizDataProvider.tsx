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

// Provider component with optional initial data (for SSR)
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

// Base hook to get the context
export function useQuizContext() {
  const context = useContext(QuizContext);
  
  if (context === undefined) {
    throw new Error('useQuizContext must be used within a QuizDataProvider');
  }
  
  return context;
}

// Selector hooks to access only specific parts of the context
// This prevents unnecessary re-renders when other parts of the context change
export function useQuizData() {
  const { quiz } = useQuizContext();
  return quiz;
}

export function useQuizLoadingState() {
  const { isLoading } = useQuizContext();
  return isLoading;
}

export function useQuizError() {
  const { error } = useQuizContext();
  return error;
}

export function useQuizRefetch() {
  const { refetch } = useQuizContext();
  return refetch;
}

// Still provide the full context access if needed
export function useFullQuizContext() {
  return useQuizContext();
}

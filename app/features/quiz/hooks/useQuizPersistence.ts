import { useCallback } from 'react';
import { QuizState, QuizAction } from '../types';
import { QuizProgressData } from '../types/quiz-config';

interface UseQuizPersistenceProps {
  quizId: string;
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  onLoadSuccess?: (data: QuizProgressData) => void;
  onLoadError?: (error: Error) => void;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
}

/**
 * Custom hook for handling quiz progress persistence
 * Handles saving, loading, and deleting quiz progress
 */
export const useQuizPersistence = ({
  quizId,
  state,
  dispatch,
  onSaveSuccess,
  onSaveError,
  onLoadSuccess,
  onLoadError,
  onDeleteSuccess,
  onDeleteError,
}: UseQuizPersistenceProps) => {
  /**
   * Save the current quiz progress
   */
  const saveProgress = useCallback(async (): Promise<void> => {
    try {
      if (state.isLoading) return; // Prevent multiple saves
      
      dispatch({ type: 'PROGRESS_SAVE_START' });
      
      // Prepare progress data
      const progressData: QuizProgressData = {
        quizId,
        currentQuestionIndex: state.currentQuestionIndex,
        answers: state.answers,
        timeElapsed: state.timeElapsed,
        startedAt: state.timeStarted || new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        metadata: {
          version: '1.0.0',
          deviceInfo: getDeviceInfo(),
        },
      };
      
      // Save to local storage (you can replace this with API calls to your backend)
      localStorage.setItem(`quiz_progress_${quizId}`, JSON.stringify(progressData));
      
      dispatch({ type: 'PROGRESS_SAVE_SUCCESS' });
      onSaveSuccess?.();
      
      return Promise.resolve();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save progress';
      dispatch({ 
        type: 'PROGRESS_SAVE_FAILURE', 
        payload: { error: errorMessage } 
      });
      
      onSaveError?.(error instanceof Error ? error : new Error(errorMessage));
      return Promise.reject(error);
    }
  }, [
    quizId, 
    state.currentQuestionIndex, 
    state.answers, 
    state.timeElapsed, 
    state.timeStarted,
    state.isLoading,
    dispatch,
    onSaveSuccess, 
    onSaveError
  ]);

  /**
   * Load saved quiz progress
   */
  const loadProgress = useCallback(async (): Promise<void> => {
    try {
      if (state.isLoading) return; // Prevent multiple loads
      
      dispatch({ type: 'PROGRESS_LOAD_START' });
      
      // Load from local storage (replace with API call to your backend)
      const savedData = localStorage.getItem(`quiz_progress_${quizId}`);
      
      if (!savedData) {
        throw new Error('No saved progress found');
      }
      
      const progressData = JSON.parse(savedData) as QuizProgressData;
      
      // Validate the loaded data
      if (!validateProgressData(progressData)) {
        throw new Error('Invalid progress data');
      }
      
      // Update state with loaded data
      dispatch({ 
        type: 'PROGRESS_LOAD_SUCCESS', 
        payload: {
          currentQuestionIndex: progressData.currentQuestionIndex,
          userAnswers: progressData.answers,
          timeElapsed: progressData.timeElapsed || 0,
          timeStarted: progressData.startedAt,
        } 
      });
      
      onLoadSuccess?.(progressData);
      return Promise.resolve();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load progress';
      dispatch({ 
        type: 'PROGRESS_LOAD_FAILURE', 
        payload: { error: errorMessage } 
      });
      
      onLoadError?.(error instanceof Error ? error : new Error(errorMessage));
      return Promise.reject(error);
    }
  }, [quizId, state.isLoading, dispatch, onLoadSuccess, onLoadError]);

  /**
   * Delete saved quiz progress
   */
  const deleteProgress = useCallback(async (): Promise<void> => {
    try {
      if (state.isLoading) return; // Prevent multiple deletes
      
      dispatch({ type: 'PROGRESS_DELETE_START' });
      
      // Remove from local storage (replace with API call to your backend)
      localStorage.removeItem(`quiz_progress_${quizId}`);
      
      dispatch({ type: 'PROGRESS_DELETE_SUCCESS' });
      onDeleteSuccess?.();
      
      return Promise.resolve();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete progress';
      dispatch({ 
        type: 'PROGRESS_DELETE_FAILURE', 
        payload: { error: errorMessage } 
      });
      
      onDeleteError?.(error instanceof Error ? error : new Error(errorMessage));
      return Promise.reject(error);
    }
  }, [quizId, state.isLoading, dispatch, onDeleteSuccess, onDeleteError]);

  /**
   * Auto-save progress at regular intervals
   */
  const useAutoSave = useCallback((interval: number = 30000) => {
    // Implementation of auto-save would go here
    // This would set up an interval to call saveProgress
    // and clean up on unmount
    
    // For now, this is a no-op
    return () => {
      // Cleanup function
    };
  }, [saveProgress]);

  return {
    saveProgress,
    loadProgress,
    deleteProgress,
    useAutoSave,
  };
};

/**
 * Validate the structure of loaded progress data
 */
function validateProgressData(data: any): data is QuizProgressData {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.quizId === 'string' &&
    typeof data.currentQuestionIndex === 'number' &&
    typeof data.answers === 'object' &&
    (typeof data.timeElapsed === 'number' || data.timeElapsed === undefined) &&
    (typeof data.startedAt === 'string' || data.startedAt === undefined) &&
    (typeof data.lastSavedAt === 'string' || data.lastSavedAt === undefined) &&
    (data.metadata === undefined || typeof data.metadata === 'object')
  );
}

/**
 * Get basic device information for analytics
 */
function getDeviceInfo() {
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
  const platform = typeof window !== 'undefined' ? window.navigator.platform : '';
  
  return {
    userAgent,
    platform,
    screenSize: typeof window !== 'undefined' ? 
      `${window.innerWidth}x${window.innerHeight}` : 'unknown',
    timestamp: new Date().toISOString(),
  };
}

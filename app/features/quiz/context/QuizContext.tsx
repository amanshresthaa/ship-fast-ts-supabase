'use client';

import React, { createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useQuizState, QuizState, QuizAction } from '../hooks/useQuizState';
import { useQuizScoring } from '../hooks/useQuizScoring';
import { AnyQuestion } from '../../../types/quiz';

// Define Context Type
interface QuizContextType {
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  submitAndScoreAnswer: (question: AnyQuestion, answer: any) => Promise<void>;
  loadProgress: (quizId: string, questionTypeFilter?: string) => Promise<{currentQuestionIndex: number; userAnswers: any} | null>;
  saveProgress: (forceSave?: boolean) => Promise<boolean>;
  deleteProgress: (quizId: string, questionTypeFilter?: string) => Promise<boolean>;
}

// Create the Context
export const QuizContext = createContext<QuizContextType | undefined>(undefined);

// QuizProvider Component
interface QuizProviderProps {
  children: ReactNode;
}

export const QuizProvider: React.FC<QuizProviderProps> = ({ children }) => {
  // Use our custom hooks
  const { state, dispatch } = useQuizState();
  const { submitAndScoreAnswer } = useQuizScoring(dispatch);

  // Function to load progress from the database
  const loadProgress = async (quizId: string, questionTypeFilter?: string) => {
    if (!quizId) return null;
    
    dispatch({ type: 'LOAD_DB_PROGRESS_START' });
    
    try {
      // Build query params
      const params = new URLSearchParams({ quizId });
      if (questionTypeFilter) {
        params.append('questionTypeFilter', questionTypeFilter);
      }
      
      // Fetch progress
      const response = await fetch(`/api/user/quiz-progress?${params.toString()}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch progress');
      }
      
      const data = await response.json();
      
      // If no progress found, return null
      if (!data.progress) {
        dispatch({ type: 'LOAD_DB_PROGRESS_SUCCESS', payload: { currentQuestionIndex: 0, userAnswers: {} } });
        return null;
      }
      
      // Load progress into state
      const progress = {
        currentQuestionIndex: data.progress.current_question_index,
        userAnswers: data.progress.user_answers
      };
      
      dispatch({ type: 'LOAD_DB_PROGRESS_SUCCESS', payload: progress });
      return progress;
    } catch (error) {
      console.error('Error loading progress:', error);
      dispatch({ 
        type: 'LOAD_DB_PROGRESS_FAILURE',
        payload: error instanceof Error ? error.message : 'Unknown error loading progress' 
      });
      return null;
    }
  };
  
  // Function to save progress to the database
  const saveProgress = async (forceSave = false) => {
    // Don't save if no quiz is loaded or if the quiz is complete (unless forced)
    if (!state.quiz?.id || (state.isQuizComplete && !forceSave)) {
      return false;
    }
    
    if (state.isSavingProgress) {
      return false; // Avoid duplicate saves
    }
    
    dispatch({ type: 'SAVE_DB_PROGRESS_START' });
    
    try {
      const response = await fetch('/api/user/quiz-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: state.quiz.id,
          questionTypeFilter: state.quiz.quiz_type || null,
          currentQuestionIndex: state.currentQuestionIndex,
          userAnswers: state.userAnswers,
          isExplicitlyCompleted: state.isQuizComplete,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save progress');
      }
      
      dispatch({ type: 'SAVE_DB_PROGRESS_SUCCESS' });
      return true;
    } catch (error) {
      console.error('Error saving progress:', error);
      dispatch({ 
        type: 'SAVE_DB_PROGRESS_FAILURE',
        payload: error instanceof Error ? error.message : 'Unknown error saving progress' 
      });
      return false;
    }
  };
  
  // Function to delete progress from the database
  const deleteProgress = async (quizId: string, questionTypeFilter?: string) => {
    if (!quizId) return false;
    
    dispatch({ type: 'DELETE_DB_PROGRESS_START' });
    
    try {
      // Build query params
      const params = new URLSearchParams({ quizId });
      if (questionTypeFilter) {
        params.append('questionTypeFilter', questionTypeFilter);
      }
      
      // Delete progress
      const response = await fetch(`/api/user/quiz-progress?${params.toString()}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete progress');
      }
      
      dispatch({ type: 'DELETE_DB_PROGRESS_SUCCESS' });
      return true;
    } catch (error) {
      console.error('Error deleting progress:', error);
      dispatch({ 
        type: 'DELETE_DB_PROGRESS_FAILURE',
        payload: error instanceof Error ? error.message : 'Unknown error deleting progress' 
      });
      return false;
    }
  };

  // We're now using the useQuizAutoSave hook instead of this timer
  // This avoids potential infinite loops from the auto-save interval

  // Create context value
  const contextValue: QuizContextType = {
    state,
    dispatch,
    submitAndScoreAnswer,
    loadProgress,
    saveProgress,
    deleteProgress
  };

  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
};

// Custom hook to use the QuizContext
export const useQuiz = (): QuizContextType => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

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

  // Progress persistence functions have moved to QuizProgressService

  // We're now using the useQuizAutoSave hook instead of this timer
  // This avoids potential infinite loops from the auto-save interval

  // Create context value
  const contextValue: QuizContextType = {
    state,
    dispatch,
    submitAndScoreAnswer
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

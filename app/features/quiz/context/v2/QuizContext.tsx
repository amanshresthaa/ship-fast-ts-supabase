'use client';

import React, { createContext, useContext, ReactNode, useReducer, useCallback, useMemo } from 'react';
import { QuizState, QuizAction, QuizContextType, QuizResults } from '../../types';
import { quizReducer, initialState } from './quizReducer';
import { useQuizTimer } from '../../hooks/useQuizTimer';
import { useQuizPersistence } from '../../hooks/useQuizPersistence';

// Create the Context with a default undefined value
const QuizContext = createContext<QuizContextType | undefined>(undefined);

// Props for the QuizProvider component
interface QuizProviderProps {
  children: ReactNode;
  quizId: string;
  onComplete?: (results: QuizResults) => void;
  config?: Partial<QuizState['config']>;
  initialData?: Partial<QuizState>;
}

/**
 * QuizProvider Component
 * Provides quiz state and actions to all child components via context
 */
export const QuizProvider: React.FC<QuizProviderProps> = ({
  children,
  quizId,
  onComplete,
  config: userConfig,
  initialData,
}) => {
  // Initialize state with reducer
  const [state, dispatch] = useReducer(quizReducer, {
    ...initialState,
    quizId,
    config: {
      ...initialState.config,
      ...userConfig,
    },
    ...initialData,
  });

  // Initialize timer hook
  const { timeRemaining, isPaused, pause, resume, reset: resetTimer } = useQuizTimer({
    initialTime: state.config.timeLimit ? state.config.timeLimit * 60 : undefined, // Convert minutes to seconds
    onTimeExpired: () => {
      if (state.config.timeLimitBehavior === 'submit') {
        handleCompleteQuiz();
      }
    },
    onWarning: (timeLeft) => {
      // Handle time warnings if needed
      console.warn(`Time warning: ${timeLeft} seconds remaining`);
    },
  });

  // Initialize persistence hook
  const { saveProgress, loadProgress, deleteProgress } = useQuizPersistence({
    quizId,
    state,
    dispatch,
  });

  // Memoized current question
  const currentQuestion = useMemo(() => {
    return state.questions[state.currentQuestionIndex] || null;
  }, [state.questions, state.currentQuestionIndex]);

  // Memoized current answer
  const currentAnswer = useMemo(() => {
    return currentQuestion ? state.answers[currentQuestion.id] : null;
  }, [currentQuestion, state.answers]);

  // Calculate progress percentage
  const progress = useMemo(() => {
    return state.questions.length > 0
      ? Math.round(((state.currentQuestionIndex + 1) / state.questions.length) * 100)
      : 0;
  }, [state.currentQuestionIndex, state.questions.length]);

  // Calculate score
  const score = useMemo(() => {
    const answeredQuestions = Object.values(state.answers);
    if (answeredQuestions.length === 0) return 0;
    
    const correctAnswers = answeredQuestions.filter(a => a.isCorrect).length;
    return Math.round((correctAnswers / state.questions.length) * 100);
  }, [state.answers, state.questions.length]);

  // Navigation handlers
  const goToNextQuestion = useCallback(() => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      dispatch({ type: 'QUESTION_NEXT' });
      return true;
    }
    return false;
  }, [state.currentQuestionIndex, state.questions.length]);

  const goToPreviousQuestion = useCallback(() => {
    if (state.currentQuestionIndex > 0) {
      dispatch({ type: 'QUESTION_PREVIOUS' });
      return true;
    }
    return false;
  }, [state.currentQuestionIndex]);

  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < state.questions.length) {
      dispatch({ type: 'QUESTION_NAVIGATE', payload: { index } });
      return true;
    }
    return false;
  }, [state.questions.length]);

  // Answer submission handler
  const submitAnswer = useCallback((questionId: string, answer: any, questionType: string) => {
    dispatch({
      type: 'ANSWER_SUBMIT',
      payload: {
        questionId,
        answer,
        questionType,
        timestamp: new Date().toISOString(),
        timeSpent: 0, // This would be calculated based on question start time
      },
    });

    // Auto-advance if configured
    if (state.config.autoAdvance) {
      setTimeout(() => goToNextQuestion(), 500); // Small delay for UX
    }
  }, [goToNextQuestion, state.config.autoAdvance]);

  // Quiz completion handler
  const completeQuiz = useCallback(() => {
    const results: QuizResults = {
      score,
      totalQuestions: state.questions.length,
      correctAnswers: Object.values(state.answers).filter(a => a.isCorrect).length,
      incorrectAnswers: Object.values(state.answers).filter(a => !a.isCorrect).length,
      timeSpent: state.timeElapsed,
      passed: score >= state.config.passingScore,
      startedAt: state.startedAt || new Date(),
      completedAt: new Date(),
      userAnswers: { ...state.answers },
      questions: [...state.questions],
      quizConfig: state.config,
    };

    // Mark quiz as completed
    dispatch({ type: 'QUIZ_COMPLETE', payload: { completedAt: new Date() } });
    
    // Call completion callback if provided
    if (onComplete) {
      onComplete(results);
    }
    
    // Save final progress
    saveProgress();
    
    // Pause timer if active
    if (!isPaused) {
      pause();
    }
  }, [
    score, 
    state.questions, 
    state.answers, 
    state.timeElapsed, 
    state.startedAt, 
    state.config, 
    onComplete, 
    saveProgress, 
    isPaused, 
    pause
  ]);

  // Flag question handler
  const flagQuestion = useCallback((questionId: string, flagged: boolean) => {
    dispatch({
      type: 'QUESTION_FLAG',
      payload: { questionId, flagged },
    });
  }, []);

  // Reset quiz handler
  const resetQuiz = useCallback(() => {
    dispatch({ type: 'QUIZ_RESET' });
    resetTimer();
    // Optionally reload questions here if needed
  }, [resetTimer]);

  // Effect to handle time updates
  React.useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused && state.isStarted && !state.isCompleted) {
        dispatch({ type: 'TIME_UPDATE' });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, state.isStarted, state.isCompleted]);

  // Effect to handle quiz completion when all questions are answered
  React.useEffect(() => {
    if (
      state.config.autoSubmitOnComplete &&
      !state.isCompleted &&
      state.questions.length > 0 &&
      Object.keys(state.answers).length >= state.questions.length
    ) {
      completeQuiz();
    }
  }, [state.answers, state.questions.length, state.isCompleted, state.config.autoSubmitOnComplete, completeQuiz]);

  // Build context value
  const contextValue: QuizContextType = {
    // State
    state: {
      ...state,
      timeRemaining,
      isPaused,
    },
    
    // Actions
    dispatch,
    submitAnswer,
    flagQuestion,
    nextQuestion: goToNextQuestion,
    previousQuestion: goToPreviousQuestion,
    navigateToQuestion: goToQuestion,
    completeQuiz,
    resetQuiz,
    saveProgress,
    loadProgress,
    deleteProgress,
    pauseTimer: pause,
    resumeTimer: resume,
    
    // Derived state
    currentQuestion,
    currentAnswer,
    progress,
    score,
    isLastQuestion: state.currentQuestionIndex === state.questions.length - 1,
    isFirstQuestion: state.currentQuestionIndex === 0,
    totalQuestions: state.questions.length,
    questionsAnswered: Object.keys(state.answers).length,
    correctAnswers: Object.values(state.answers).filter(a => a.isCorrect).length,
    incorrectAnswers: Object.values(state.answers).filter(a => !a.isCorrect).length,
    timeSpent: state.timeElapsed,
  };

  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
};

/**
 * Custom hook to use the quiz context
 * @throws {Error} If used outside of QuizProvider
 */
export const useQuiz = (): QuizContextType => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

// Export the context for advanced usage
export { QuizContext };

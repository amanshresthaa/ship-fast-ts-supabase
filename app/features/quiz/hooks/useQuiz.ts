import { useCallback, useMemo } from 'react';
import { useQuiz as useQuizContext } from '../context/v2/QuizContext';
import { QuizQuestion, UserAnswer, QuizResults } from '../types';

/**
 * Primary hook for quiz functionality
 * Provides a clean API for interacting with the quiz state and actions
 */
export const useQuiz = () => {
  // Get the context
  const context = useQuizContext();
  
  // Destructure the context for easier access
  const {
    state,
    dispatch,
    submitAnswer: contextSubmitAnswer,
    flagQuestion,
    nextQuestion,
    previousQuestion,
    navigateToQuestion,
    completeQuiz,
    resetQuiz,
    saveProgress,
    loadProgress,
    deleteProgress,
    pauseTimer,
    resumeTimer,
  } = context;
  
  // Derived state
  const {
    currentQuestion,
    currentAnswer,
    progress,
    score,
    isLastQuestion,
    isFirstQuestion,
    totalQuestions,
    questionsAnswered,
    correctAnswers,
    incorrectAnswers,
    timeSpent,
    isStarted,
    isCompleted,
    isPaused,
    timeRemaining,
    error,
  } = state;
  
  /**
   * Submit an answer for the current question
   */
  const submitAnswer = useCallback((answer: any) => {
    if (!currentQuestion) return;
    
    return contextSubmitAnswer(
      currentQuestion.id,
      answer,
      currentQuestion.type
    );
  }, [currentQuestion, contextSubmitAnswer]);
  
  /**
   * Submit the quiz for final scoring
   */
  const submitQuiz = useCallback(async (): Promise<QuizResults> => {
    return new Promise((resolve) => {
      const results = completeQuiz();
      resolve(results);
    });
  }, [completeQuiz]);
  
  /**
   * Toggle pause/resume the quiz timer
   */
  const togglePause = useCallback(() => {
    if (isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  }, [isPaused, pauseTimer, resumeTimer]);
  
  /**
   * Skip the current question
   */
  const skipQuestion = useCallback(() => {
    if (!isLastQuestion) {
      nextQuestion();
    }
  }, [isLastQuestion, nextQuestion]);
  
  /**
   * Get the current question number (1-based index)
   */
  const currentQuestionNumber = useMemo(() => {
    return state.currentQuestionIndex + 1;
  }, [state.currentQuestionIndex]);
  
  /**
   * Get the total number of questions
   */
  const totalQuestionsCount = useMemo(() => {
    return state.questions.length;
  }, [state.questions.length]);
  
  /**
   * Get the current question by index
   */
  const getQuestion = useCallback((index: number): QuizQuestion | undefined => {
    return state.questions[index];
  }, [state.questions]);
  
  /**
   * Get the answer for a specific question
   */
  const getAnswer = useCallback((questionId: string): UserAnswer | undefined => {
    return state.answers[questionId];
  }, [state.answers]);
  
  /**
   * Check if a question has been answered
   */
  const isQuestionAnswered = useCallback((questionId: string): boolean => {
    return questionId in state.answers;
  }, [state.answers]);
  
  /**
   * Check if a question is flagged
   */
  const isQuestionFlagged = useCallback((questionId: string): boolean => {
    return state.flaggedQuestions.has(questionId);
  }, [state.flaggedQuestions]);
  
  /**
   * Get the current progress percentage
   */
  const progressPercentage = useMemo(() => {
    if (totalQuestionsCount === 0) return 0;
    return Math.round((questionsAnswered / totalQuestionsCount) * 100);
  }, [questionsAnswered, totalQuestionsCount]);
  
  /**
   * Get the current score as a percentage
   */
  const scorePercentage = useMemo(() => {
    if (questionsAnswered === 0) return 0;
    return Math.round((correctAnswers / questionsAnswered) * 100);
  }, [correctAnswers, questionsAnswered]);
  
  // Return the public API
  return {
    // State
    currentQuestion,
    currentAnswer,
    currentQuestionNumber,
    totalQuestions: totalQuestionsCount,
    progress: progressPercentage,
    score: scorePercentage,
    isLastQuestion,
    isFirstQuestion,
    questionsAnswered,
    correctAnswers,
    incorrectAnswers,
    timeSpent,
    timeRemaining,
    isStarted,
    isCompleted,
    isPaused,
    error,
    
    // Actions
    submitAnswer,
    submitQuiz,
    flagQuestion,
    nextQuestion,
    previousQuestion,
    navigateToQuestion,
    skipQuestion,
    resetQuiz,
    togglePause,
    saveProgress,
    loadProgress,
    deleteProgress,
    
    // Getters
    getQuestion,
    getAnswer,
    isQuestionAnswered,
    isQuestionFlagged,
    
    // Raw state access (use with caution)
    state,
    dispatch,
  };
};

// Re-export types for convenience
export type { QuizQuestion, UserAnswer, QuizResults } from '../types';

// Export a hook for checking if we're inside a QuizProvider
export { useQuizContext };

// Export a hook for creating a standalone quiz instance
export { useStandaloneQuiz } from './useStandaloneQuiz';

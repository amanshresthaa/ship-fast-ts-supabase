import { useReducer, useCallback, useMemo, useEffect } from 'react';
import { QuizState, QuizAction, QuizQuestion, UserAnswer, QuizResults } from '../types';
import { quizReducer, initialState } from '../context/v2/quizReducer';
import { useQuizTimer } from './useQuizTimer';
import { useQuizPersistence } from './useQuizPersistence';

interface UseStandaloneQuizProps {
  questions: QuizQuestion[];
  quizId?: string;
  config?: Partial<QuizState['config']>;
  onComplete?: (results: QuizResults) => void;
  autoStart?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

/**
 * A standalone hook for managing quiz state without the need for a context provider
 * Ideal for simple quiz implementations or when you need multiple independent quiz instances
 */
export const useStandaloneQuiz = ({
  questions,
  quizId = 'standalone-quiz',
  config: userConfig = {},
  onComplete,
  autoStart = true,
  autoSave = true,
  autoSaveInterval = 30000,
}: UseStandaloneQuizProps) => {
  // Initialize state with reducer
  const [state, dispatch] = useReducer(quizReducer, {
    ...initialState,
    quizId,
    questions,
    config: {
      ...initialState.config,
      ...userConfig,
    },
    isStarted: autoStart,
  });

  // Initialize timer
  const {
    timeLeft,
    isPaused,
    totalSeconds: timeRemaining,
    pause: pauseTimer,
    resume: resumeTimer,
    reset: resetTimer,
  } = useQuizTimer({
    initialTime: state.config.timeLimit ? state.config.timeLimit * 60 : undefined,
    onTimeExpired: () => {
      if (state.config.timeLimitBehavior === 'submit') {
        handleCompleteQuiz();
      }
    },
  });

  // Initialize persistence
  const { saveProgress, loadProgress, deleteProgress } = useQuizPersistence({
    quizId,
    state,
    dispatch,
  });

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !state.isStarted || state.isCompleted) return;
    
    const interval = setInterval(() => {
      saveProgress();
    }, autoSaveInterval);
    
    return () => clearInterval(interval);
  }, [autoSave, autoSaveInterval, saveProgress, state.isStarted, state.isCompleted]);

  // Memoized current question
  const currentQuestion = useMemo(() => {
    return state.questions[state.currentQuestionIndex] || null;
  }, [state.questions, state.currentQuestionIndex]);

  // Memoized current answer
  const currentAnswer = useMemo(() => {
    return currentQuestion ? state.answers[currentQuestion.id] : null;
  }, [currentQuestion, state.answers]);

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
  const completeQuiz = useCallback((): QuizResults => {
    const results: QuizResults = {
      score: calculateScore(),
      totalQuestions: state.questions.length,
      correctAnswers: Object.values(state.answers).filter(a => a.isCorrect).length,
      incorrectAnswers: Object.values(state.answers).filter(a => !a.isCorrect).length,
      timeSpent: state.timeElapsed,
      passed: calculateScore() >= state.config.passingScore,
      startedAt: state.timeStarted || new Date(),
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
      pauseTimer();
    }
    
    return results;
  }, [
    state.questions, 
    state.answers, 
    state.timeElapsed, 
    state.timeStarted, 
    state.config, 
    onComplete, 
    saveProgress, 
    isPaused, 
    pauseTimer
  ]);

  // Calculate current score
  const calculateScore = useCallback((): number => {
    const answeredQuestions = Object.values(state.answers);
    if (answeredQuestions.length === 0) return 0;
    
    const correctAnswers = answeredQuestions.filter(a => a.isCorrect).length;
    return Math.round((correctAnswers / state.questions.length) * 100);
  }, [state.answers, state.questions.length]);

  // Start the quiz
  const startQuiz = useCallback(() => {
    if (state.isStarted && !state.isCompleted) return;
    
    dispatch({ type: 'QUIZ_START' });
    resumeTimer();
  }, [state.isStarted, state.isCompleted, resumeTimer]);

  // Reset the quiz
  const resetQuiz = useCallback(() => {
    dispatch({ type: 'QUIZ_RESET' });
    resetTimer();
  }, [resetTimer]);

  // Flag a question
  const flagQuestion = useCallback((questionId: string, flagged: boolean) => {
    dispatch({
      type: 'QUESTION_FLAG',
      payload: { questionId, flagged },
    });
  }, []);

  // Toggle pause/resume
  const togglePause = useCallback(() => {
    if (isPaused) {
      resumeTimer();
      dispatch({ type: 'QUIZ_RESUME' });
    } else {
      pauseTimer();
      dispatch({ type: 'QUIZ_PAUSE' });
    }
  }, [isPaused, pauseTimer, resumeTimer]);

  // Handle quiz completion when all questions are answered
  useEffect(() => {
    if (
      state.config.autoSubmitOnComplete &&
      !state.isCompleted &&
      state.questions.length > 0 &&
      Object.keys(state.answers).length >= state.questions.length
    ) {
      completeQuiz();
    }
  }, [state.answers, state.questions.length, state.isCompleted, state.config.autoSubmitOnComplete, completeQuiz]);

  // Calculate derived state
  const progress = useMemo(() => {
    return state.questions.length > 0
      ? Math.round(((state.currentQuestionIndex + 1) / state.questions.length) * 100)
      : 0;
  }, [state.currentQuestionIndex, state.questions.length]);

  const score = useMemo(() => calculateScore(), [calculateScore]);
  const isLastQuestion = state.currentQuestionIndex === state.questions.length - 1;
  const isFirstQuestion = state.currentQuestionIndex === 0;
  const questionsAnswered = Object.keys(state.answers).length;
  const correctAnswers = Object.values(state.answers).filter(a => a.isCorrect).length;
  const incorrectAnswers = questionsAnswered - correctAnswers;

  // Return the public API
  return {
    // State
    currentQuestion,
    currentAnswer,
    currentQuestionNumber: state.currentQuestionIndex + 1,
    totalQuestions: state.questions.length,
    progress,
    score,
    isLastQuestion,
    isFirstQuestion,
    questionsAnswered,
    correctAnswers,
    incorrectAnswers,
    timeSpent: state.timeElapsed,
    timeRemaining,
    isStarted: state.isStarted,
    isCompleted: state.isCompleted,
    isPaused,
    error: state.error,
    
    // Actions
    startQuiz,
    submitAnswer,
    submitQuiz: completeQuiz,
    flagQuestion,
    nextQuestion: goToNextQuestion,
    previousQuestion: goToPreviousQuestion,
    navigateToQuestion: goToQuestion,
    togglePause,
    resetQuiz,
    saveProgress,
    loadProgress,
    deleteProgress,
    
    // Getters
    getQuestion: (index: number) => state.questions[index],
    getAnswer: (questionId: string) => state.answers[questionId],
    isQuestionAnswered: (questionId: string) => questionId in state.answers,
    isQuestionFlagged: (questionId: string) => state.flaggedQuestions.has(questionId),
    
    // Raw state and dispatch (use with caution)
    state,
    dispatch,
  };
};

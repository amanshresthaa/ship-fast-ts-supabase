/**
 * Core types for the Quiz feature module
 * Organized by domain concerns for better maintainability
 */

// ========================
// 1. Question Types
// ========================

/** Supported question types in the quiz */
export type QuestionType = 
  | 'single_selection'    // Multiple choice with single answer
  | 'multi_selection'     // Multiple choice with multiple answers
  | 'true_false'          // True/False questions
  | 'short_answer'        // Text input answer
  | 'dropdown_selection'  // Dropdown menu selection
  | 'order'               // Reorder items
  | 'yes_no'              // Yes/No question
  | 'yesno_multi'         // Multiple Yes/No questions
  | 'drag_and_drop'       // Drag and drop interaction
  | 'matching';           // Match items between columns

/** Difficulty levels for quiz questions */
export type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/** Base interface for all question types */
export interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string;
  explanation?: string;
  difficulty?: QuestionDifficulty;
  category?: string;
  tags?: string[];
  points?: number;
  timeLimit?: number; // in seconds
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  metadata?: Record<string, any>;
}

// ========================
// 2. Answer Types
// ========================

/** Base interface for user answers */
export interface BaseUserAnswer {
  questionId: string;
  answer: any;
  isCorrect?: boolean;
  timestamp: number;
  timeSpent: number; // in seconds
  pointsEarned?: number;
  isFlagged?: boolean;
  feedback?: string;
  metadata?: Record<string, any>;
}

// ========================
// 3. Quiz Configuration
// ========================
/** Quiz configuration and settings */
export interface QuizConfig {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  totalQuestions: number;
  timeLimit?: number; // in minutes
  passingScore: number; // 0-100
  maxAttempts?: number;
  showCorrectAnswers: boolean;
  showScoreAtEnd: boolean;
  randomizeQuestions: boolean;
  shuffleAnswers: boolean;
  reviewEnabled: boolean;
  feedbackMode: 'immediate' | 'deferred' | 'none';
  showProgress: boolean;
  requireFullScreen: boolean;
  allowedMaterials?: string[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  version?: string;
}

// ========================
// 4. Quiz State
// ========================
/** Quiz state management */
export interface QuizState {
  // Quiz metadata
  quiz: QuizConfig | null;
  questions: BaseQuestion[];
  
  // User progress
  currentQuestionIndex: number;
  userAnswers: Record<string, BaseUserAnswer>;
  flaggedQuestions: Set<string>;
  
  // Status flags
  isLoading: boolean;
  isQuizComplete: boolean;
  isStarted: boolean;
  isPaused: boolean;
  error: string | null;
  
  // UI state
  showFeedbackForCurrentQuestion: boolean;
  
  // Progress tracking
  isSavingProgress: boolean;
  isLoadingProgress: boolean;
  progressError: string | null;
  
  // Timer state
  timeRemaining?: number; // in seconds
  timeElapsed: number; // in seconds
  
  // Session data
  sessionId?: string;
  startedAt?: Date;
  completedAt?: Date;
}

// ========================
// 5. Action Types
// ========================
/** Base action type */
type Action<T extends string, P = undefined> = P extends undefined
  ? { type: T }
  : { type: T } & P;

/** Quiz action types */
export type QuizAction =
  // Quiz lifecycle actions
  | Action<'QUIZ_LOAD_START'>
  | Action<'QUIZ_LOAD_SUCCESS', { quiz: QuizConfig; questions: BaseQuestion[] }>
  | Action<'QUIZ_LOAD_FAILURE', { error: string }>
  | Action<'QUIZ_START'>
  | Action<'QUIZ_COMPLETE'>
  | Action<'QUIZ_RESET'>
  | Action<'QUIZ_PAUSE'>
  | Action<'QUIZ_RESUME'>
  
  // Question navigation
  | Action<'QUESTION_NEXT'>
  | Action<'QUESTION_PREVIOUS'>
  | Action<'QUESTION_NAVIGATE', { index: number }>
  
  // Answer submission
  | Action<
      'ANSWER_SUBMIT', 
      { 
        questionId: string; 
        answer: any; 
        questionType: QuestionType;
        isCorrect?: boolean;
        pointsEarned?: number;
      }
    >
  | Action<'ANSWER_UPDATE', { questionId: string; answer: any; }>
  | Action<'ANSWER_FLAG', { questionId: string; flagged: boolean }>
  
  // Progress persistence
  | Action<'PROGRESS_SAVE_START'>
  | Action<'PROGRESS_SAVE_SUCCESS'>
  | Action<'PROGRESS_SAVE_FAILURE', { error: string }>
  | Action<'PROGRESS_LOAD_START'>
  | Action<
      'PROGRESS_LOAD_SUCCESS', 
      { 
        currentQuestionIndex: number; 
        userAnswers: Record<string, BaseUserAnswer> 
      }
    >
  | Action<'PROGRESS_LOAD_FAILURE', { error: string }>
  | Action<'PROGRESS_DELETE_START'>
  | Action<'PROGRESS_DELETE_SUCCESS'>
  | Action<'PROGRESS_DELETE_FAILURE', { error: string }>;

// ========================
// 6. Context & Hooks
// ========================
/** Quiz context type */
export interface QuizContextType {
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  
  // Helper methods
  submitAnswer: (questionId: string, answer: any, questionType: QuestionType) => Promise<void>;
  flagQuestion: (questionId: string, flagged: boolean) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  navigateToQuestion: (index: number) => void;
  completeQuiz: () => void;
  resetQuiz: () => void;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  deleteProgress: () => Promise<void>;
  
  // Derived state
  currentQuestion: BaseQuestion | null;
  currentAnswer: BaseUserAnswer | null;
  progress: number; // 0-100
  score: number; // 0-100
  isLastQuestion: boolean;
  isFirstQuestion: boolean;
  totalQuestions: number;
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: number; // in seconds
}

// ========================
// 7. API & Services
// ========================
/** Quiz API response types */
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  success: boolean;
}

/** Quiz progress data for persistence */
export interface QuizProgressData {
  quizId: string;
  currentQuestionIndex: number;
  userAnswers: Record<string, BaseUserAnswer>;
  timeSpent: number;
  startedAt: string;
  lastSavedAt: string;
  metadata?: Record<string, any>;
}

// ========================
// 8. Component Props
// ========================
/** Props for the main Quiz component */
export interface QuizProps {
  quizId: string;
  onComplete?: (results: QuizResults) => void;
  onQuestionChange?: (question: BaseQuestion, index: number) => void;
  onAnswerSubmit?: (answer: BaseUserAnswer, question: BaseQuestion) => void;
  config?: Partial<QuizConfig>;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/** Quiz results after completion */
export interface QuizResults {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: number;
  passed: boolean;
  startedAt: Date;
  completedAt: Date;
  userAnswers: Record<string, BaseUserAnswer>;
  questions: BaseQuestion[];
  quizConfig: QuizConfig;
}

// Re-export commonly used types
export * from './question-types';
export * from './answer-types';
export * from './quiz-config';

// Type guards
export const isQuizComplete = (state: QuizState): boolean => 
  state.isQuizComplete;

export const isQuizStarted = (state: QuizState): boolean =>
  state.isStarted && !state.isQuizComplete;

export const isQuizLoading = (state: QuizState): boolean =>
  state.isLoading || state.isLoadingProgress;

export const hasQuizError = (state: QuizState): boolean =>
  state.error !== null || state.progressError !== null;

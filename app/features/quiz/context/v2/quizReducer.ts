import { QuizState, QuizAction, QuizQuestion, UserAnswer } from '../../types';

/** Initial state for the quiz */
export const initialState: QuizState = {
  // Quiz metadata
  quizId: '',
  title: 'Untitled Quiz',
  description: '',
  
  // Questions
  questions: [],
  currentQuestionIndex: 0,
  
  // User answers
  answers: {},
  flaggedQuestions: new Set<string>(),
  
  // Quiz status
  isStarted: false,
  isCompleted: false,
  isPaused: false,
  isLoading: false,
  error: null,
  
  // Timing
  timeElapsed: 0,
  timeStarted: null,
  timePaused: null,
  timeResumed: null,
  timeCompleted: null,
  
  // Configuration
  config: {
    shuffleQuestions: false,
    shuffleAnswers: false,
    showFeedback: true,
    showResults: true,
    allowBackNavigation: true,
    allowQuestionReview: true,
    autoAdvance: true,
    autoSubmitOnComplete: true,
    timeLimit: undefined, // in seconds
    passingScore: 70, // percentage
    maxAttempts: undefined,
    requireFullScreen: false,
    showProgressBar: true,
    showQuestionNumbers: true,
    showTimer: true,
    showScore: true,
  },
};

/**
 * Quiz reducer function
 * Handles all state updates for the quiz
 */
export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    // Quiz lifecycle actions
    case 'QUIZ_LOAD_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
      
    case 'QUIZ_LOAD_SUCCESS':
      return {
        ...state,
        isLoading: false,
        questions: action.payload.questions,
        title: action.payload.title || state.title,
        description: action.payload.description || state.description,
        config: {
          ...state.config,
          ...action.payload.config,
        },
      };
      
    case 'QUIZ_LOAD_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
      };
      
    case 'QUIZ_START':
      return {
        ...state,
        isStarted: true,
        timeStarted: new Date().toISOString(),
        timeElapsed: 0,
      };
      
    case 'QUIZ_PAUSE':
      if (state.isPaused) return state;
      return {
        ...state,
        isPaused: true,
        timePaused: new Date().toISOString(),
      };
      
    case 'QUIZ_RESUME':
      if (!state.isPaused) return state;
      return {
        ...state,
        isPaused: false,
        timeResumed: new Date().toISOString(),
        timePaused: null,
      };
      
    case 'QUIZ_COMPLETE':
      return {
        ...state,
        isCompleted: true,
        timeCompleted: action.payload.completedAt || new Date().toISOString(),
        isPaused: true, // Pause timer on completion
      };
      
    case 'QUIZ_RESET':
      return {
        ...initialState,
        quizId: state.quizId,
        config: { ...state.config },
      };
      
    // Question navigation
    case 'QUESTION_NEXT':
      if (state.currentQuestionIndex >= state.questions.length - 1) {
        return state; // Already at last question
      }
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
      };
      
    case 'QUESTION_PREVIOUS':
      if (state.currentQuestionIndex <= 0) {
        return state; // Already at first question
      }
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex - 1,
      };
      
    case 'QUESTION_NAVIGATE':
      if (
        action.payload.index < 0 ||
        action.payload.index >= state.questions.length ||
        action.payload.index === state.currentQuestionIndex
      ) {
        return state;
      }
      return {
        ...state,
        currentQuestionIndex: action.payload.index,
      };
      
    // Answer submission
    case 'ANSWER_SUBMIT':
      const { questionId, answer, questionType, timestamp, timeSpent } = action.payload;
      const question = state.questions.find(q => q.id === questionId);
      
      if (!question) return state;
      
      // Create or update the answer
      const updatedAnswers = {
        ...state.answers,
        [questionId]: {
          questionId,
          answer,
          questionType,
          timestamp,
          timeSpent,
          isCorrect: isAnswerCorrect(question, answer),
          // Additional properties can be added based on question type
        } as UserAnswer,
      };
      
      return {
        ...state,
        answers: updatedAnswers,
      };
      
    case 'ANSWER_UPDATE':
      if (!state.answers[action.payload.questionId]) {
        return state; // No existing answer to update
      }
      
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionId]: {
            ...state.answers[action.payload.questionId],
            answer: action.payload.answer,
            timestamp: new Date().toISOString(),
          },
        },
      };
      
    case 'ANSWER_FLAG':
      const flaggedQuestions = new Set(state.flaggedQuestions);
      if (action.payload.flagged) {
        flaggedQuestions.add(action.payload.questionId);
      } else {
        flaggedQuestions.delete(action.payload.questionId);
      }
      
      return {
        ...state,
        flaggedQuestions,
      };
      
    // Progress persistence
    case 'PROGRESS_SAVE_START':
      return {
        ...state,
        isLoading: true,
      };
      
    case 'PROGRESS_SAVE_SUCCESS':
      return {
        ...state,
        isLoading: false,
        lastSaved: new Date().toISOString(),
      };
      
    case 'PROGRESS_SAVE_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
      };
      
    case 'PROGRESS_LOAD_START':
      return {
        ...state,
        isLoading: true,
      };
      
    case 'PROGRESS_LOAD_SUCCESS':
      return {
        ...state,
        isLoading: false,
        currentQuestionIndex: action.payload.currentQuestionIndex,
        answers: action.payload.userAnswers,
        // Preserve existing state for other fields
      };
      
    case 'PROGRESS_LOAD_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
      };
      
    case 'PROGRESS_DELETE_START':
      return {
        ...state,
        isLoading: true,
      };
      
    case 'PROGRESS_DELETE_SUCCESS':
      return {
        ...initialState,
        quizId: state.quizId,
        config: { ...state.config },
      };
      
    case 'PROGRESS_DELETE_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
      };
      
    // Timer updates
    case 'TIME_UPDATE':
      return {
        ...state,
        timeElapsed: state.timeElapsed + 1,
      };
      
    // Configuration updates
    case 'CONFIG_UPDATE':
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload.updates,
        },
      };
      
    default:
      return state;
  }
}

/**
 * Helper function to check if an answer is correct
 * This is a simplified version - you might want to move this to a separate utility
 * and implement more sophisticated validation based on question type
 */
function isAnswerCorrect(question: QuizQuestion, answer: any): boolean {
  // This is a placeholder - implement actual validation based on question type
  if (!question.correctAnswer) return false;
  
  if (Array.isArray(question.correctAnswer)) {
    if (!Array.isArray(answer)) return false;
    
    // For array answers, check if all correct answers are included
    // and no incorrect answers are included
    return (
      question.correctAnswer.every(ca => answer.includes(ca)) &&
      answer.every((a: any) => question.correctAnswer.includes(a))
    );
  }
  
  // For single-value answers, do a simple equality check
  return answer === question.correctAnswer;
}

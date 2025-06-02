import { useReducer } from 'react';
import { AnyQuestion, Quiz, QuestionType } from '../../../types/quiz';

// Define structure for storing answers
export interface UserAnswer {
  answer: any; 
  isCorrect?: boolean;
  timestamp: number;
}

export interface UserAnswersState {
  [questionId: string]: UserAnswer;
}

// Quiz State Definition
export interface QuizState {
  quiz: Quiz | null;
  questions: AnyQuestion[];
  currentQuestionIndex: number;
  userAnswers: UserAnswersState;
  flaggedQuestions: Set<string>; // Track flagged question IDs
  isLoading: boolean;
  error: string | null;
  isQuizComplete: boolean;
  showFeedbackForCurrentQuestion: boolean;
  // Added states for DB progress tracking
  isSavingProgress: boolean;
  isLoadingProgress: boolean;
  progressError: string | null;
}

// Action Types
export type QuizAction = 
  | { type: 'LOAD_QUIZ_START' }
  | { type: 'LOAD_QUIZ_SUCCESS'; payload: Quiz }
  | { type: 'LOAD_QUIZ_FAILURE'; payload: string }
  | { 
      type: 'SUBMIT_ANSWER'; 
      payload: { 
        questionId: string; 
        answer: any; 
        questionType: QuestionType; 
        // Optional fields for client-side validation based on question type
        correctAnswerOptionId?: string; // For single_selection
        correctAnswerOptionIds?: string[]; // For multi
        correctDropdownAnswers?: Record<string, string>; // For dropdown_selection
        correctOrder?: string[]; // For order
        correctYesNoAnswer?: boolean; // For yes_no
        correctYesNoMultiAnswers?: boolean[]; // For yesno_multi
      }
    }
  | { type: 'UPDATE_ANSWER_CORRECTNESS'; payload: { questionId: string; isCorrect: boolean, serverVerifiedCorrectAnswer?: any } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'NAVIGATE_TO_QUESTION'; payload: number }
  | { type: 'COMPLETE_QUIZ' }
  | { type: 'RESET_QUIZ' }
  | { type: 'SHOW_FEEDBACK'; payload: { questionId: string } }
  | { type: 'TOGGLE_FLAG_QUESTION'; payload: string } // questionId
  // Added action types for DB progress
  | { type: 'LOAD_DB_PROGRESS_START' }
  | { type: 'LOAD_DB_PROGRESS_SUCCESS'; payload: { currentQuestionIndex: number; userAnswers: UserAnswersState } }
  | { type: 'LOAD_DB_PROGRESS_FAILURE'; payload: string }
  | { type: 'SAVE_DB_PROGRESS_START' }
  | { type: 'SAVE_DB_PROGRESS_SUCCESS' }
  | { type: 'SAVE_DB_PROGRESS_FAILURE'; payload: string }
  | { type: 'DELETE_DB_PROGRESS_START' }
  | { type: 'DELETE_DB_PROGRESS_SUCCESS' }
  | { type: 'DELETE_DB_PROGRESS_FAILURE'; payload: string }
  // New action type for restoring saved progress
  | { type: 'RESTORE_QUIZ_PROGRESS'; payload: { currentQuestionIndex: number; userAnswers: UserAnswersState } };

// Initial State
const initialState: QuizState = {
  quiz: null,
  questions: [],
  currentQuestionIndex: 0,
  userAnswers: {},
  flaggedQuestions: new Set<string>(),
  isLoading: false,
  error: null,
  isQuizComplete: false,
  showFeedbackForCurrentQuestion: false,
  isSavingProgress: false,
  isLoadingProgress: false,
  progressError: null,
};

// Quiz Reducer
const quizReducer = (state: QuizState, action: QuizAction): QuizState => {
  switch (action.type) {
    case 'LOAD_QUIZ_START':
      return { ...initialState, isLoading: true }; 
    case 'LOAD_QUIZ_SUCCESS':
      return {
        ...initialState,
        quiz: action.payload,
        questions: action.payload.questions,
        isLoading: false,
      };
    case 'LOAD_QUIZ_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    
    case 'SUBMIT_ANSWER': {
      let isClientCorrect: boolean | undefined = undefined;
      
      if (action.payload.questionType === 'single_selection' && action.payload.correctAnswerOptionId !== undefined) {
        isClientCorrect = action.payload.answer === action.payload.correctAnswerOptionId;
      } else if (action.payload.questionType === 'multi' && action.payload.correctAnswerOptionIds !== undefined) {
        const selectedAnswers = action.payload.answer as string[];
        const correctAnswers = action.payload.correctAnswerOptionIds;
        isClientCorrect = 
          selectedAnswers.length === correctAnswers.length && 
          selectedAnswers.every(id => correctAnswers.includes(id)) &&
          correctAnswers.every(id => selectedAnswers.includes(id));
      } else if (action.payload.questionType === 'drag_and_drop') {
        // For drag-and-drop, we'll rely on server validation (this seems to be a legacy or different type)
        console.log('Drag and drop answer submitted:', action.payload.answer);
      } else if (action.payload.questionType === 'dropdown_selection' && action.payload.correctDropdownAnswers) {
        const userSelections = action.payload.answer as Record<string, string | null>;
        const correctAnswers = action.payload.correctDropdownAnswers;
        let allCorrect = true;
        for (const placeholderKey in correctAnswers) {
          if (userSelections[placeholderKey] !== correctAnswers[placeholderKey]) {
            allCorrect = false;
            break;
          }
        }
        // Also ensure the user has made a selection for all placeholders defined in correctAnswers
        if (allCorrect) {
          for (const placeholderKey in correctAnswers) {
            if (userSelections[placeholderKey] === null || userSelections[placeholderKey] === undefined) {
              allCorrect = false;
              break;
            }
          }
        }
        isClientCorrect = allCorrect;
      } else if (action.payload.questionType === 'order' && action.payload.correctOrder) {
        const userAnswer = action.payload.answer as Record<string, string | null>;
        const correctOrder = action.payload.correctOrder;
        let allCorrect = true;
        if (Object.keys(userAnswer).length !== correctOrder.length) {
          // This basic check might be too strict if partial completion is allowed before submission.
          // However, for full correctness, the number of placed items should match the total correct items.
          // For now, let's assume OrderController.isAnswerComplete handles partial states,
          // and here we check for final correctness.
          // A more robust check would involve the OrderValidator's getCorrectnessMap.
          // For simplicity in client-side check, we'll compare slot by slot.
        }

        for (let i = 0; i < correctOrder.length; i++) {
          const slotKey = `slot-${i}`; // Assuming slot keys are 'slot-0', 'slot-1', etc.
          const expectedItemId = correctOrder[i];
          if (userAnswer[slotKey] !== expectedItemId) {
            allCorrect = false;
            break;
          }
        }
        // Ensure no extra items are placed in slots not part of correctOrder
        for (const slotKey in userAnswer) {
          const slotIndex = parseInt(slotKey.split('-')[1], 10);
          if (slotIndex >= correctOrder.length && userAnswer[slotKey] !== null) {
            allCorrect = false;
            break;
          }
        }
        isClientCorrect = allCorrect;
      } else if (action.payload.questionType === 'yes_no' && action.payload.correctYesNoAnswer !== undefined) {
        // Simple comparison for yes_no questions
        isClientCorrect = action.payload.answer === action.payload.correctYesNoAnswer;
      } else if (action.payload.questionType === 'yesno_multi' && action.payload.correctYesNoMultiAnswers) {
        // Compare each answer for yesno_multi questions
        const userAnswers = action.payload.answer as boolean[];
        const correctAnswers = action.payload.correctYesNoMultiAnswers;
        
        // Make sure arrays are the same length
        if (userAnswers.length !== correctAnswers.length) {
          isClientCorrect = false;
        } else {
          // Check each answer
          isClientCorrect = userAnswers.every((answer, index) => answer === correctAnswers[index]);
        }
      }

      return {
        ...state,
        userAnswers: {
          ...state.userAnswers,
          [action.payload.questionId]: {
            answer: action.payload.answer,
            isCorrect: isClientCorrect,
            timestamp: Date.now(),
          },
        },
        showFeedbackForCurrentQuestion: true, 
      };
    }

    case 'UPDATE_ANSWER_CORRECTNESS': {
      if (!state.userAnswers[action.payload.questionId]) {
        console.warn('UPDATE_ANSWER_CORRECTNESS called for a question not in userAnswers', action.payload.questionId);
        return state; 
      }

      return {
        ...state,
        userAnswers: {
          ...state.userAnswers,
          [action.payload.questionId]: {
            ...state.userAnswers[action.payload.questionId],
            isCorrect: action.payload.isCorrect,
          },
        },
      };
    }

    case 'NEXT_QUESTION': {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        const nextQuestionId = state.questions[state.currentQuestionIndex + 1]?.id;
        const nextQuestionHasAnswer = nextQuestionId ? state.userAnswers[nextQuestionId] !== undefined : false;
        return {
          ...state,
          currentQuestionIndex: state.currentQuestionIndex + 1,
          showFeedbackForCurrentQuestion: nextQuestionHasAnswer,
        };
      }
      return { ...state, isQuizComplete: true }; 
    }

    case 'PREVIOUS_QUESTION': {
      if (state.currentQuestionIndex > 0) {
        const prevQuestionId = state.questions[state.currentQuestionIndex - 1]?.id;
        const prevQuestionHasAnswer = prevQuestionId ? state.userAnswers[prevQuestionId] !== undefined : false;
        return {
          ...state,
          currentQuestionIndex: state.currentQuestionIndex - 1,
          showFeedbackForCurrentQuestion: prevQuestionHasAnswer,
        };
      }
      return state;
    }

    case 'NAVIGATE_TO_QUESTION': {
      if (action.payload >= 0 && action.payload < state.questions.length) {
        const targetQuestionId = state.questions[action.payload]?.id;
        const targetQuestionHasAnswer = targetQuestionId ? state.userAnswers[targetQuestionId] !== undefined : false;
        return {
          ...state,
          currentQuestionIndex: action.payload,
          showFeedbackForCurrentQuestion: targetQuestionHasAnswer,
        };
      }
      return state;
    }

    case 'COMPLETE_QUIZ': {
      return { ...state, isQuizComplete: true, showFeedbackForCurrentQuestion: true };
    }

    case 'SHOW_FEEDBACK': {
      return { ...state, showFeedbackForCurrentQuestion: true };
    }

    case 'RESET_QUIZ': {
      return initialState;
    }

    case 'TOGGLE_FLAG_QUESTION': {
      const questionId = action.payload;
      const newFlaggedQuestions = new Set(state.flaggedQuestions);
      
      if (newFlaggedQuestions.has(questionId)) {
        newFlaggedQuestions.delete(questionId);
      } else {
        newFlaggedQuestions.add(questionId);
      }
      
      return { ...state, flaggedQuestions: newFlaggedQuestions };
    }

    case 'DELETE_DB_PROGRESS_FAILURE': {
      return { ...state, isSavingProgress: false, progressError: action.payload };
    }

    case 'LOAD_DB_PROGRESS_START':
      return { ...state, isLoadingProgress: true, progressError: null };
      
    case 'LOAD_DB_PROGRESS_SUCCESS':
      return {
        ...state,
        isLoadingProgress: false,
        currentQuestionIndex: action.payload.currentQuestionIndex,
        userAnswers: action.payload.userAnswers,
        progressError: null,
      };
      
    case 'LOAD_DB_PROGRESS_FAILURE':
      return { ...state, isLoadingProgress: false, progressError: action.payload };

    case 'SAVE_DB_PROGRESS_START':
      return { ...state, isSavingProgress: true, progressError: null };
      
    case 'SAVE_DB_PROGRESS_SUCCESS':
      return { ...state, isSavingProgress: false, progressError: null };
      
    case 'SAVE_DB_PROGRESS_FAILURE':
      return { ...state, isSavingProgress: false, progressError: action.payload };

    case 'DELETE_DB_PROGRESS_START':
      return { ...state, isSavingProgress: true, progressError: null };
      
    case 'DELETE_DB_PROGRESS_SUCCESS':
      return { ...state, isSavingProgress: false, progressError: null };

    case 'RESTORE_QUIZ_PROGRESS':
      return {
        ...state,
        currentQuestionIndex: action.payload.currentQuestionIndex,
        userAnswers: action.payload.userAnswers,
      };

    default:
      return state;
  }
};

// Hook for Quiz State
export const useQuizState = () => {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  
  return {
    state,
    dispatch
  };
};

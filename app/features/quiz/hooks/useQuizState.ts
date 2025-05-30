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
  isLoading: boolean;
  error: string | null;
  isQuizComplete: boolean;
  showFeedbackForCurrentQuestion: boolean;
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
        correctAnswerOptionId?: string; 
        correctAnswerOptionIds?: string[];
      }
    }
  | { type: 'UPDATE_ANSWER_CORRECTNESS'; payload: { questionId: string; isCorrect: boolean, serverVerifiedCorrectAnswer?: any } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'COMPLETE_QUIZ' }
  | { type: 'RESET_QUIZ' }
  | { type: 'SHOW_FEEDBACK'; payload: { questionId: string } };

// Initial State
const initialState: QuizState = {
  quiz: null,
  questions: [],
  currentQuestionIndex: 0,
  userAnswers: {},
  isLoading: false,
  error: null,
  isQuizComplete: false,
  showFeedbackForCurrentQuestion: false,
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
    
    case 'SUBMIT_ANSWER':
      let isClientCorrect: boolean | undefined = undefined;
      
      if (action.payload.questionType === 'single_selection' && action.payload.correctAnswerOptionId !== undefined) {
        isClientCorrect = action.payload.answer === action.payload.correctAnswerOptionId;
      } else if (action.payload.questionType === 'multi' && action.payload.correctAnswerOptionIds !== undefined) {
        // For multi-selection questions, check if the selected answers match the correct answers exactly
        const selectedAnswers = action.payload.answer as string[];
        const correctAnswers = action.payload.correctAnswerOptionIds;
        
        // Check if arrays have the same elements (regardless of order)
        isClientCorrect = 
          selectedAnswers.length === correctAnswers.length && 
          selectedAnswers.every(id => correctAnswers.includes(id)) &&
          correctAnswers.every(id => selectedAnswers.includes(id));
      } else if (action.payload.questionType === 'drag_and_drop') {
        // For drag-and-drop, we'll rely on server validation
        console.log('Drag and drop answer submitted:', action.payload.answer);
        // Don't set isClientCorrect here, will be updated by server response
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

    case 'UPDATE_ANSWER_CORRECTNESS':
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

    case 'NEXT_QUESTION':
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

    case 'PREVIOUS_QUESTION':
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

    case 'COMPLETE_QUIZ':
      return { ...state, isQuizComplete: true, showFeedbackForCurrentQuestion: true };

    case 'SHOW_FEEDBACK':
      return { ...state, showFeedbackForCurrentQuestion: true };

    case 'RESET_QUIZ':
      return initialState;
      
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

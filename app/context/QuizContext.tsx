'use client';

import React, { createContext, useReducer, useContext, ReactNode, Dispatch } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js'; // Import Supabase client
import { AnyQuestion, Quiz, BaseQuestion } from '../types/quiz'; // Added BaseQuestion

// Define structure for storing answers
export interface UserAnswer {
  answer: any; // The actual answer given by the user (e.g., optionId)
  isCorrect?: boolean; // To be updated after server-side validation
  timestamp: number; // When the answer was submitted
}

export interface UserAnswersState {
  [questionId: string]: UserAnswer;
}

// Initialize Supabase client for Edge Function calls
// This should use the public URL and anon key as Edge Functions are typically invoked from the client-side context.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; 
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseFunctionsClient: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  supabaseFunctionsClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase URL or Anon Key for function calls is not defined. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.');
}

// 1. Define QuizState
interface QuizState {
  quiz: Quiz | null;
  questions: AnyQuestion[];
  currentQuestionIndex: number;
  userAnswers: UserAnswersState;
  isLoading: boolean;
  error: string | null;
  isQuizComplete: boolean;
  // To control when to show feedback/correct answers for the current question
  showFeedbackForCurrentQuestion: boolean; 
}

// 2. Define QuizAction Types
export type QuizAction = 
  | { type: 'LOAD_QUIZ_START' }
  | { type: 'LOAD_QUIZ_SUCCESS'; payload: Quiz }
  | { type: 'LOAD_QUIZ_FAILURE'; payload: string }
  | { type: 'SUBMIT_ANSWER'; payload: { questionId: string; answer: any; } } // Answer submitted, awaiting validation
  | { type: 'UPDATE_ANSWER_CORRECTNESS'; payload: { questionId: string; isCorrect: boolean, serverVerifiedCorrectAnswer?: any } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' } // Added for navigation
  | { type: 'COMPLETE_QUIZ' }
  | { type: 'RESET_QUIZ' }
  | { type: 'SHOW_FEEDBACK'; payload: { questionId: string } }; // Action to trigger feedback display for a question

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

// 3. Implement quizReducer
const quizReducer = (state: QuizState, action: QuizAction): QuizState => {
  switch (action.type) {
    case 'LOAD_QUIZ_START':
      return { ...initialState, isLoading: true }; 
    case 'LOAD_QUIZ_SUCCESS':
      return {
        ...initialState, // Reset most state for a new quiz
        quiz: action.payload,
        questions: action.payload.questions,
        isLoading: false,
      };
    case 'LOAD_QUIZ_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    
    case 'SUBMIT_ANSWER': // This action now primarily records the attempt
      return {
        ...state,
        userAnswers: {
          ...state.userAnswers,
          [action.payload.questionId]: {
            answer: action.payload.answer,
            isCorrect: undefined, // Server will confirm this
            timestamp: Date.now(),
          },
        },
        showFeedbackForCurrentQuestion: true, // Show some immediate feedback indication
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
            // Optionally store serverVerifiedCorrectAnswer if needed for complex feedback
          },
        },
      };

    case 'NEXT_QUESTION':
      if (state.currentQuestionIndex < state.questions.length - 1) {
        return {
          ...state,
          currentQuestionIndex: state.currentQuestionIndex + 1,
          showFeedbackForCurrentQuestion: !!state.userAnswers[state.questions[state.currentQuestionIndex + 1]?.id], // Show feedback if next Q already answered
        };
      }
      // If on the last question, clicking next could mean complete quiz
      return { ...state, isQuizComplete: true }; 

    case 'PREVIOUS_QUESTION':
      if (state.currentQuestionIndex > 0) {
        return {
          ...state,
          currentQuestionIndex: state.currentQuestionIndex - 1,
          showFeedbackForCurrentQuestion: !!state.userAnswers[state.questions[state.currentQuestionIndex - 1]?.id], // Show feedback if prev Q already answered
        };
      }
      return state;

    case 'COMPLETE_QUIZ':
      return { ...state, isQuizComplete: true, showFeedbackForCurrentQuestion: true }; // Show feedback for all on completion

    case 'SHOW_FEEDBACK': // Could be used to manually trigger feedback for a question if needed
        return { ...state, showFeedbackForCurrentQuestion: true };

    case 'RESET_QUIZ':
      return initialState;
    default:
      return state;
  }
};

// 4. Create QuizContext
interface QuizContextType {
  state: QuizState;
  dispatch: Dispatch<QuizAction>;
  // Expose the submitAndScoreAnswer function via context
  submitAndScoreAnswer: (question: BaseQuestion, answer: any) => Promise<void>; 
}

export const QuizContext = createContext<QuizContextType | undefined>(undefined);

// New async thunk-like function to handle submitting and scoring
export const createSubmitAndScoreAnswerFunction = (dispatch: Dispatch<QuizAction>) => {
  return async (question: BaseQuestion, answer: any) => {
    if (!supabaseFunctionsClient) {
      console.error('Supabase client for functions not initialized.');
      // Optionally dispatch an error action to update UI
      // dispatch({ type: 'QUIZ_ERROR', payload: 'Failed to connect to scoring service.' });
      return;
    }

    // 1. Dispatch SUBMIT_ANSWER to record the attempt immediately
    dispatch({ 
      type: 'SUBMIT_ANSWER', 
      payload: { questionId: question.id, answer }
    });

    try {
      // 2. Invoke the Edge Function
      const { data: scoreData, error: functionError } = await supabaseFunctionsClient.functions.invoke(
        'score-answer', 
        {
          body: { 
            questionId: question.id, 
            userAnswer: answer, 
            questionType: question.type 
          }
        }
      );

      if (functionError) {
        console.error('Error invoking score-answer Edge Function:', functionError.message);
        // Optionally dispatch an error to UI
        // dispatch({ type: 'QUIZ_ERROR', payload: 'Error scoring answer.' });
        // Potentially revert SUBMIT_ANSWER or mark as error if needed
        return;
      }

      if (scoreData && scoreData.questionId === question.id) {
        // 3. Dispatch UPDATE_ANSWER_CORRECTNESS with the server-validated result
        dispatch({
          type: 'UPDATE_ANSWER_CORRECTNESS',
          payload: { 
            questionId: scoreData.questionId,
            isCorrect: scoreData.isCorrect,
            serverVerifiedCorrectAnswer: scoreData.correctAnswer // Optional: if you want to store it
          }
        });
      } else {
        console.error('Score data mismatch or missing from Edge Function response:', scoreData);
        // dispatch({ type: 'QUIZ_ERROR', payload: 'Invalid response from scoring service.' });
      }
    } catch (e: any) {
      console.error('Unexpected error during submitAndScoreAnswer:', e.message);
      // dispatch({ type: 'QUIZ_ERROR', payload: 'Unexpected error scoring answer.' });
    }
  };
};

// 5. Create QuizProvider component
interface QuizProviderProps {
  children: ReactNode;
}

export const QuizProvider = ({ children }: QuizProviderProps) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  
  // Create the submitAndScoreAnswer function with the current dispatch
  const submitAndScoreAnswer = createSubmitAndScoreAnswerFunction(dispatch);

  return (
    <QuizContext.Provider value={{ state, dispatch, submitAndScoreAnswer }}>
      {children}
    </QuizContext.Provider>
  );
};

// Custom hook to use the QuizContext
export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}; 
import { useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AnyQuestion } from '../../../types/quiz';
import { QuizAction } from './useQuizState';

// Initialize Supabase client for Edge Function calls
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; 
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseFunctionsClient: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  supabaseFunctionsClient = createClient(supabaseUrl, supabaseAnonKey);
}

// Hook for handling answer submission and scoring
export const useQuizScoring = (dispatch: React.Dispatch<QuizAction>) => {
  const submitAndScoreAnswer = useCallback(async (question: AnyQuestion, answer: any) => {
    if (!supabaseFunctionsClient) {
      console.error('Supabase client for functions not initialized.');
      return;
    }

    let submitPayload: QuizAction = {
      type: 'SUBMIT_ANSWER',
      payload: {
        questionId: question.id,
        answer,
        questionType: question.type,
      }
    };

    // For single selection questions, we can do client-side validation
    if (question.type === 'single_selection') {
      submitPayload.payload.correctAnswerOptionId = question.correctAnswerOptionId;
    }

    // First update the UI immediately
    dispatch(submitPayload);

    try {
      // Then send to server for validation
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
        return;
      }

      if (scoreData && scoreData.questionId === question.id) {
        dispatch({
          type: 'UPDATE_ANSWER_CORRECTNESS',
          payload: { 
            questionId: scoreData.questionId,
            isCorrect: scoreData.isCorrect,
            serverVerifiedCorrectAnswer: scoreData.correctAnswer 
          }
        });
      } else {
        console.error('Score data mismatch or missing from Edge Function response:', scoreData);
      }
    } catch (e: any) {
      console.error('Unexpected error during submitAndScoreAnswer:', e.message);
    }
  }, [dispatch]);

  return { submitAndScoreAnswer };
};

import { useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AnyQuestion, YesNoQuestion, YesNoMultiQuestion } from '../../../types/quiz';
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

    // Add specific correct answer details for client-side validation
    switch(question.type) {
      case 'single_selection':
        submitPayload.payload.correctAnswerOptionId = (question as any).correctAnswerOptionId;
        break;
      case 'multi':
        submitPayload.payload.correctAnswerOptionIds = (question as any).correctAnswerOptionIds;
        break;
      case 'dropdown_selection':
        // For dropdown, map placeholderTargets to the expected format for client-side validation
        const correctDropdownAnswers: Record<string, string> = {};
        if ((question as any).placeholderTargets) {
          for (const key in (question as any).placeholderTargets) {
            correctDropdownAnswers[key] = (question as any).placeholderTargets[key].correctOptionText;
          }
        }
        submitPayload.payload.correctDropdownAnswers = correctDropdownAnswers;
        break;
      case 'order':
        // For 'order' questions, pass the correctOrder array for client-side validation
        submitPayload.payload.correctOrder = (question as any).correctOrder;
        break;
      case 'yes_no':
        // For yes/no questions
        submitPayload.payload.correctYesNoAnswer = (question as YesNoQuestion).correctAnswer;
        break;
      case 'yesno_multi':
        // For multi-statement yes/no questions
        submitPayload.payload.correctYesNoMultiAnswers = (question as YesNoMultiQuestion).correctAnswers;
        break;
    }

    // First update the UI immediately with client-side validation results
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
        
        // Show feedback after answer submission
        dispatch({
          type: 'SHOW_FEEDBACK',
          payload: { questionId: question.id }
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

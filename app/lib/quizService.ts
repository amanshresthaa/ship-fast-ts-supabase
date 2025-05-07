import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  BaseQuestion, 
  AnyQuestion, 
  SingleSelectionQuestion, 
  SingleSelectionOption,
  Quiz // Will be needed for fetchQuizById
} from '../types/quiz';

// Initialize Supabase client
// Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or Service Role Key is not defined in environment variables.');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false } // Recommended for server-side clients
});

export async function enrichQuestionWithDetails(
  baseQuestion: BaseQuestion
): Promise<AnyQuestion | null> {
  if (baseQuestion.type === 'single_selection') {
    try {
      // Fetch options for the single selection question
      const { data: optionsData, error: optionsError } = await supabase
        .from('single_selection_options')
        .select('option_id, text')
        .eq('question_id', baseQuestion.id);

      if (optionsError) {
        console.error(`Error fetching options for question ${baseQuestion.id}:`, optionsError.message);
        return null;
      }

      // Fetch the correct answer for the single selection question
      const { data: correctAnswerData, error: correctAnswerError } = await supabase
        .from('single_selection_correct_answer')
        .select('option_id')
        .eq('question_id', baseQuestion.id)
        .single(); // Expecting only one row

      if (correctAnswerError) {
        // .single() throws an error if no row is found, or more than one is found.
        // We can check the error code/details if needed, e.g. PostgrestError PGRST116 (0 rows)
        if (correctAnswerError.code === 'PGRST116') {
            console.warn(`No correct answer found for single_selection question ${baseQuestion.id}. (PGRST116)`);
        } else {
            console.error(`Error fetching correct answer for question ${baseQuestion.id}:`, correctAnswerError.message);
        }
        return null;
      }

      if (!correctAnswerData) { // Should be redundant if .single() succeeded, but good for safety
        console.warn(`No correct answer data returned for single_selection question ${baseQuestion.id} despite no error.`);
        return null;
      }

      const typedOptions: SingleSelectionOption[] = (optionsData || []).map((opt: any) => ({
        option_id: opt.option_id,
        text: opt.text,
      }));

      const correctAnswerOptionId = correctAnswerData.option_id;

      // It's possible optionsData is empty, which might be valid for a question under construction.
      // However, a correct answer ID must exist.
      if (!correctAnswerOptionId) {
        console.warn(`Correct answer option_id missing after fetch for single_selection question ${baseQuestion.id}`);
        return null; // Critical data missing
      }
      
      const singleSelectionQuestion: SingleSelectionQuestion = {
        ...baseQuestion,
        type: 'single_selection',
        options: typedOptions,
        correctAnswerOptionId: correctAnswerOptionId,
      };
      return singleSelectionQuestion;

    } catch (error: any) {
      console.error(`Unexpected error enriching single_selection question ${baseQuestion.id}:`, error.message || error);
      return null;
    }
  } else {
    console.warn(`enrichQuestionWithDetails: Unhandled question type '${baseQuestion.type}' for Q ID ${baseQuestion.id}. Returning null.`);
    return null; 
  }
}

// Placeholder for fetchQuizById - to be implemented next
export async function fetchQuizById(
  quizId: string,
): Promise<Quiz | null> {
  try {
    // 1. Fetch quiz metadata
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizError) {
      if (quizError.code === 'PGRST116') { // Not found
        console.warn(`Quiz with ID '${quizId}' not found.`);
      } else {
        console.error(`Error fetching quiz ${quizId}:`, quizError.message);
      }
      return null;
    }
    if (!quizData) {
      console.warn(`No data for quiz ${quizId} despite no error.`);
      return null;
    }

    // 2. Fetch base questions for the quiz
    const { data: baseQuestionsData, error: questionsError } = await supabase
      .from('questions')
      .select('*') // Select all base question fields
      .eq('quiz_tag', quizId);

    if (questionsError) {
      console.error(`Error fetching questions for quiz ${quizId}:`, questionsError.message);
      return null;
    }

    // 3. Enrich each question with its specific details
    const enrichedQuestionsPromises = (baseQuestionsData || []).map(bq => 
      enrichQuestionWithDetails(bq as BaseQuestion)
    );
    const resolvedQuestions = await Promise.all(enrichedQuestionsPromises);
    const successfullyEnrichedQuestions = resolvedQuestions.filter(q => q !== null) as AnyQuestion[];

    if (baseQuestionsData && successfullyEnrichedQuestions.length !== baseQuestionsData.length) {
      console.warn(`Not all questions for quiz ${quizId} could be successfully enriched.`);
    }

    return {
      ...(quizData as Quiz), // Spread fetched quiz metadata
      questions: successfullyEnrichedQuestions, // Add the array of enriched questions
    };

  } catch (error: any) {
    console.error(`Unexpected error in fetchQuizById for quiz ${quizId}:`, error.message || error);
    return null;
  }
} 
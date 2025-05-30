import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  BaseQuestion, 
  AnyQuestion, 
  SingleSelectionQuestion, 
  MultiChoiceQuestion,
  SelectionOption,
  DragAndDropTarget,
  DragAndDropOption,
  DragAndDropCorrectPair,
  DragAndDropQuestion,
  Quiz // Will be needed for fetchQuizById
} from '../types/quiz';

// Initialize Supabase client
// Using hardcoded values from .env file for debugging
const supabaseUrl = "https://rvwvnralrlsdtugtgict.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2d3ZucmFscmxzZHR1Z3RnaWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTQ0NzM0NCwiZXhwIjoyMDYxMDIzMzQ0fQ.hFRjn5zq24WmKEoCLbWDRUY6dUdEjlPS-c4OemCaFM4";

console.log('Supabase Environment Variables:');
console.log('URL:', supabaseUrl ? 'Defined' : 'Undefined');
console.log('Service Role Key:', supabaseServiceRoleKey ? 'Defined' : 'Undefined');

// No need to check for undefined since we're using hardcoded values
// if (!supabaseUrl || !supabaseServiceRoleKey) {
//   throw new Error('Supabase URL or Service Role Key is not defined in environment variables.');
// }

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

      const typedOptions: SelectionOption[] = (optionsData || []).map((opt: any) => ({
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
  } else if (baseQuestion.type === 'multi') {
    try {
      // Fetch options for the multi-choice question
      const { data: optionsData, error: optionsError } = await supabase
        .from('multi_options')
        .select('option_id, text')
        .eq('question_id', baseQuestion.id);

      if (optionsError) {
        console.error(`Error fetching options for multi question ${baseQuestion.id}:`, optionsError.message);
        return null;
      }

      // Fetch the correct answers for the multi-choice question
      const { data: correctAnswersData, error: correctAnswersError } = await supabase
        .from('multi_correct_answers')
        .select('option_id')
        .eq('question_id', baseQuestion.id);

      if (correctAnswersError) {
        console.error(`Error fetching correct answers for multi question ${baseQuestion.id}:`, correctAnswersError.message);
        return null;
      }

      const typedOptions: SelectionOption[] = (optionsData || []).map((opt: any) => ({
        option_id: opt.option_id,
        text: opt.text,
      }));

      const correctAnswerOptionIds = (correctAnswersData || []).map((ans: any) => ans.option_id);

      if (!correctAnswerOptionIds.length) {
        console.warn(`No correct answer options found for multi question ${baseQuestion.id}`);
        return null; // Critical data missing
      }
      
      const multiChoiceQuestion: MultiChoiceQuestion = {
        ...baseQuestion,
        type: 'multi',
        options: typedOptions,
        correctAnswerOptionIds: correctAnswerOptionIds,
      };
      return multiChoiceQuestion;

    } catch (error: any) {
      console.error(`Unexpected error enriching multi question ${baseQuestion.id}:`, error.message || error);
      return null;
    }
  } else if (baseQuestion.type === 'drag_and_drop') {
    try {
      // Fetch targets for the drag and drop question
      const { data: targetsData, error: targetsError } = await supabase
        .from('drag_and_drop_targets')
        .select('target_id, text')
        .eq('question_id', baseQuestion.id);

      if (targetsError) {
        console.error(`Error fetching targets for drag_and_drop question ${baseQuestion.id}:`, targetsError.message);
        return null;
      }

      // Fetch options for the drag and drop question
      const { data: optionsData, error: optionsError } = await supabase
        .from('drag_and_drop_options')
        .select('option_id, text')
        .eq('question_id', baseQuestion.id);

      if (optionsError) {
        console.error(`Error fetching options for drag_and_drop question ${baseQuestion.id}:`, optionsError.message);
        return null;
      }

      // Fetch correct pairs for the drag and drop question
      const { data: correctPairsData, error: correctPairsError } = await supabase
        .from('drag_and_drop_correct_pairs')
        .select('option_id, target_id')
        .eq('question_id', baseQuestion.id);

      if (correctPairsError) {
        console.error(`Error fetching correct pairs for drag_and_drop question ${baseQuestion.id}:`, correctPairsError.message);
        return null;
      }

      const typedTargets: DragAndDropTarget[] = (targetsData || []).map((target: any) => ({
        target_id: target.target_id,
        text: target.text,
      }));

      const typedOptions: DragAndDropOption[] = (optionsData || []).map((option: any) => ({
        option_id: option.option_id,
        text: option.text,
      }));

      const typedCorrectPairs: DragAndDropCorrectPair[] = (correctPairsData || []).map((pair: any) => ({
        option_id: pair.option_id,
        target_id: pair.target_id,
      }));

      // Check if we have the minimum required data
      if (!typedTargets.length) {
        console.warn(`No targets found for drag_and_drop question ${baseQuestion.id}`);
        return null;
      }
      if (!typedOptions.length) {
        console.warn(`No options found for drag_and_drop question ${baseQuestion.id}`);
        return null;
      }
      if (!typedCorrectPairs.length) {
        console.warn(`No correct pairs found for drag_and_drop question ${baseQuestion.id}`);
        return null;
      }

      const dragAndDropQuestion: DragAndDropQuestion = {
        ...baseQuestion,
        type: 'drag_and_drop',
        targets: typedTargets,
        options: typedOptions,
        correctPairs: typedCorrectPairs,
      };
      return dragAndDropQuestion;

    } catch (error: any) {
      console.error(`Unexpected error enriching drag_and_drop question ${baseQuestion.id}:`, error.message || error);
      return null;
    }
<<<<<<< HEAD
  } else if (baseQuestion.type === 'dropdown_selection') { // New case for dropdown_selection
    try {
      // Fetch all available options for this dropdown question
      const { data: optionsData, error: optionsError } = await supabase
        .from('dropdown_selection_options')
        .select('option_id, text, is_correct') // is_correct might be useful for some UI/logic
        .eq('question_id', baseQuestion.id);

      if (optionsError) {
        console.error(`Error fetching options for dropdown_selection question ${baseQuestion.id}:`, optionsError.message);
        return null;
      }

      // Fetch the placeholder-to-correct-value mappings
      const { data: targetsData, error: targetsError } = await supabase
        .from('dropdown_selection_targets')
        .select('key, value') // 'key' is the placeholder, 'value' is the correct option's text
        .eq('question_id', baseQuestion.id);

      if (targetsError) {
        console.error(`Error fetching targets for dropdown_selection question ${baseQuestion.id}:`, targetsError.message);
        return null;
      }

      const typedOptions: DropdownOption[] = (optionsData || []).map((opt: any) => ({
        option_id: opt.option_id,
        text: opt.text,
        is_correct: opt.is_correct, // Keep is_correct as it's in the table and type
      }));

      const placeholderTargets: Record<string, DropdownPlaceholderTarget> = {};
      (targetsData || []).forEach((target: any) => {
        placeholderTargets[target.key] = {
          key: target.key,
          correctOptionText: target.value,
        };
      });

      // Create the correctAnswers map
      const correctAnswers: Record<string, string> = {};
      for (const key in placeholderTargets) {
        correctAnswers[key] = placeholderTargets[key].correctOptionText;
      }

      if (!typedOptions.length) {
        console.warn(`No options found for dropdown_selection question ${baseQuestion.id}`);
        return null; // Critical: a dropdown question must have options
      }
      if (Object.keys(placeholderTargets).length === 0) {
        console.warn(`No placeholder targets found for dropdown_selection question ${baseQuestion.id}`);
        return null; // Critical: must have target mappings
      }

      const dropdownSelectionQuestion: DropdownSelectionQuestion = {
        ...baseQuestion,
        type: 'dropdown_selection',
        options: typedOptions,
        placeholderTargets: placeholderTargets, // Keep this if it's used elsewhere, or remove if redundant
        correctAnswers: correctAnswers, // Populate the correctAnswers field
      };
      return dropdownSelectionQuestion;

    } catch (error: any) {
      console.error(`Unexpected error enriching dropdown_selection question ${baseQuestion.id}:`, error.message || error);
      return null;
    }
=======
>>>>>>> parent of 8d100cc (Added Dropdown Selection)
  } else {
    console.warn(`enrichQuestionWithDetails: Unhandled question type '${baseQuestion.type}' for Q ID ${baseQuestion.id}. Returning null.`);
    return null; 
  }
}

export async function fetchQuizById(
  quizId: string,
  questionType?: string
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

    // 2. Fetch base questions for the quiz, with optional type filter
    let query = supabase
      .from('questions')
      .select('*') // Select all base question fields
      .eq('quiz_tag', quizId);
      
    // Apply type filter if provided
    if (questionType) {
      query = query.eq('type', questionType);
    }
    
    // Execute the query
    const { data: baseQuestionsData, error: questionsError } = await query;

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

// New function to fetch a random question by type and filters
export async function fetchRandomQuestionByTypeAndFilters(
  type: string, // Should be QuestionType, but using string for broader initial compatibility
  filters: { difficulty?: string; tags?: string[] }
): Promise<AnyQuestion | null> {
  try {
    let query = supabase
      .from('questions')
      .select('*')
      .eq('type', type);

    if (filters.difficulty && filters.difficulty !== 'all') {
      query = query.eq('difficulty', filters.difficulty);
    }

    if (filters.tags && filters.tags.length > 0) {
      // Assuming quiz_tag can be used for general tagging for now
      // If you have a separate tags table or array column, this would need adjustment
      query = query.in('quiz_tag', filters.tags);
    }

    // Fetch multiple to then pick one randomly, or use a database-specific random function
    // For simplicity, fetching a few and picking the first one.
    // For true randomness and performance on large datasets, a DB function like RANDOM() or TABLESAMPLE is better.
    query = query.limit(10); // Fetch up to 10 matching questions

    const { data: baseQuestionsData, error: questionsError } = await query;

    if (questionsError) {
      console.error(`Error fetching questions by type ${type} and filters:`, questionsError.message);
      return null;
    }

    if (!baseQuestionsData || baseQuestionsData.length === 0) {
      console.warn(`No questions found for type ${type} with current filters.`);
      return null;
    }

    // Pick a random question from the fetched ones
    const randomIndex = Math.floor(Math.random() * baseQuestionsData.length);
    const randomBaseQuestion = baseQuestionsData[randomIndex] as BaseQuestion;

    if (!randomBaseQuestion) {
      return null;
    }

    // Enrich the selected base question with its specific details
    return await enrichQuestionWithDetails(randomBaseQuestion);

  } catch (error: any) {
    console.error(`Unexpected error in fetchRandomQuestionByTypeAndFilters for type ${type}:`, error.message || error);
    return null;
  }
}
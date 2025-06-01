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
  DropdownOption,
  DropdownPlaceholderTarget,
  DropdownSelectionQuestion,
  OrderQuestion,
  OrderItem,
  YesNoQuestion,
  YesNoMultiQuestion,
  YesNoStatement,
  Quiz
} from '../types/quiz';

// Initialize Supabase client
// Using hardcoded values from .env file for debugging
const supabaseUrl = "https://rvwvnralrlsdtugtgict.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2d3ZucmFscmxzZHR1Z3RnaWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTQ0NzM0NCwiZXhwIjoyMDYxMDIzMzQ0fQ.hFRjn5zq24WmKEoCLbWDRUY6dUdEjlPS-c4OemCaFM4";

console.log('Supabase Environment Variables:');
console.log('URL:', supabaseUrl ? 'Defined' : 'Undefined');
console.log('Service Role Key:', supabaseServiceRoleKey ? 'Defined' : 'Undefined');

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false } // Recommended for server-side clients
});

// Export all helper functions for testing
export {
  enrichSingleSelectionQuestions,
  enrichMultiChoiceQuestions,
  enrichDragAndDropQuestions,
  enrichDropdownSelectionQuestions,
  enrichOrderQuestions,
  enrichYesNoQuestions,
  enrichYesNoMultiQuestions,
};

/**
 * Enriches a base quiz question with all necessary details for its specific type.
 *
 * Depending on the question's type, fetches and attaches related options, targets, correct answers, or other required data from the database. Returns a fully constructed question object of the appropriate type, or `null` if required data is missing or an error occurs.
 *
 * @param baseQuestion - The base question object to enrich.
 * @returns The enriched question object with all necessary details, or `null` if enrichment fails or the type is unrecognized.
 */
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
        placeholderTargets: placeholderTargets,
      };
      return dropdownSelectionQuestion;

    } catch (error: any) {
      console.error(`Unexpected error enriching dropdown_selection question ${baseQuestion.id}:`, error.message || error);
      return null;
    }
  } else if (baseQuestion.type === 'order') {
    try {
      // Fetch the order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('item_id, text')
        .eq('question_id', baseQuestion.id);

      if (itemsError) {
        console.error(`Error fetching items for order question ${baseQuestion.id}:`, itemsError.message);
        return null;
      }

      // Fetch the correct order sequence
      const { data: correctOrderData, error: correctOrderError } = await supabase
        .from('order_correct_order')
        .select('item_id, position')
        .eq('question_id', baseQuestion.id)
        .order('position', { ascending: true });

      if (correctOrderError) {
        console.error(`Error fetching correct order for question ${baseQuestion.id}:`, correctOrderError.message);
        return null;
      }

      const items: OrderItem[] = (itemsData || []).map((item: any) => ({
        item_id: item.item_id,
        text: item.text,
      }));

      // Sort by position and extract just the item_ids for correctOrder
      const correctOrder = (correctOrderData || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((item: any) => item.item_id);

      if (!items.length) {
        console.warn(`No items found for order question ${baseQuestion.id}`);
        return null;
      }

      if (!correctOrder.length) {
        console.warn(`No correct order found for order question ${baseQuestion.id}`);
        return null;
      }

      const orderQuestion: OrderQuestion = {
        ...baseQuestion,
        type: 'order',
        items: items,
        correctOrder: correctOrder,
      };
      return orderQuestion;

    } catch (error: any) {
      console.error(`Unexpected error enriching order question ${baseQuestion.id}:`, error.message || error);
      return null;
    }
  } else if (baseQuestion.type === 'yes_no') {
    try {
      // Fetch the correct answer for the yes/no question
      const { data: correctAnswerData, error: correctAnswerError } = await supabase
        .from('yes_no_answer')
        .select('correct_answer')
        .eq('question_id', baseQuestion.id)
        .single();

      if (correctAnswerError) {
        if (correctAnswerError.code === 'PGRST116') {
          console.warn(`No correct answer found for yes_no question ${baseQuestion.id}. (PGRST116)`);
        } else {
          console.error(`Error fetching correct answer for yes_no question ${baseQuestion.id}:`, correctAnswerError.message);
        }
        return null;
      }

      if (!correctAnswerData) {
        console.warn(`No correct answer data returned for yes_no question ${baseQuestion.id} despite no error.`);
        return null;
      }

      const yesNoQuestion: YesNoQuestion = {
        ...baseQuestion,
        type: 'yes_no',
        correctAnswer: correctAnswerData.correct_answer
      };
      return yesNoQuestion;

    } catch (error: any) {
      console.error(`Unexpected error enriching yes_no question ${baseQuestion.id}:`, error.message || error);
      return null;
    }
  } else if (baseQuestion.type === 'yesno_multi') {
    try {
      // Fetch statements for the multi-statement yes/no question
      const { data: statementsData, error: statementsError } = await supabase
        .from('yesno_multi_statements')
        .select('statement_id, text')
        .eq('question_id', baseQuestion.id);

      if (statementsError) {
        console.error(`Error fetching statements for yesno_multi question ${baseQuestion.id}:`, statementsError.message);
        return null;
      }

      // Fetch correct answers for each statement
      const { data: correctAnswersData, error: correctAnswersError } = await supabase
        .from('yesno_multi_correct_answers')
        .select('statement_id, correct_answer')
        .eq('question_id', baseQuestion.id);

      if (correctAnswersError) {
        console.error(`Error fetching correct answers for yesno_multi question ${baseQuestion.id}:`, correctAnswersError.message);
        return null;
      }

      const statements: YesNoStatement[] = (statementsData || []).map((stmt: any) => ({
        statement_id: stmt.statement_id,
        text: stmt.text,
      }));

      // Sort the statements by statement_id to ensure the correct answers array matches
      statements.sort((a, b) => a.statement_id.localeCompare(b.statement_id));

      // Create an array of correct answers that matches the statements array order
      const correctAnswers: boolean[] = statements.map(stmt => {
        const matchingAnswer = correctAnswersData?.find((ans: any) => ans.statement_id === stmt.statement_id);
        return matchingAnswer ? matchingAnswer.correct_answer : false;
      });

      if (!statements.length) {
        console.warn(`No statements found for yesno_multi question ${baseQuestion.id}`);
        return null;
      }

      if (correctAnswers.length !== statements.length) {
        console.warn(`Mismatch between statements and correct answers for yesno_multi question ${baseQuestion.id}`);
        return null;
      }

      const yesNoMultiQuestion: YesNoMultiQuestion = {
        ...baseQuestion,
        type: 'yesno_multi',
        statements,
        correctAnswers
      };
      return yesNoMultiQuestion;

    } catch (error: any) {
      console.error(`Unexpected error enriching yesno_multi question ${baseQuestion.id}:`, error.message || error);
      return null;
    }
  } else {
    console.warn(`enrichQuestionWithDetails: Unhandled question type '${baseQuestion.type}' for Q ID ${baseQuestion.id}. Returning null.`);
    return null; 
  }
}

/**
 * Fetches a quiz by its ID, including all associated questions enriched with detailed data and randomized order.
 *
 * Optionally filters questions by one or more specified types. Questions are batch-enriched by type, then randomized to ensure variety and unpredictability in their order.
 *
 * @param quizId - The unique identifier of the quiz to fetch.
 * @param questionTypes - Optional question type or array of types to filter which questions are included.
 * @returns The quiz object with enriched and randomized questions, or `null` if the quiz is not found or an error occurs.
 *
 * @remark
 * If some questions cannot be enriched due to missing or incomplete data, they are omitted from the returned quiz.
 */
export async function fetchQuizById(
  quizId: string,
  questionTypes?: string | string[]
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
    if (questionTypes) {
      if (typeof questionTypes === 'string') {
        // Single question type
        query = query.eq('type', questionTypes);
      } else if (Array.isArray(questionTypes) && questionTypes.length > 0) {
        // Multiple question types - use 'in' operator
        query = query.in('type', questionTypes);
      }
    }
    
    // Execute the query
    const { data: baseQuestionsData, error: questionsError } = await query;

    if (questionsError) {
      console.error(`Error fetching questions for quiz ${quizId}:`, questionsError.message);
      return null;
    }
    
    if (!baseQuestionsData || baseQuestionsData.length === 0) {
      return {
        ...(quizData as Quiz),
        questions: [],
      };
    }

    // Group questions by type for batch processing
    const questionsByType = groupQuestionsByType(baseQuestionsData as BaseQuestion[]);

    // Enrich questions by type in parallel
    const enrichmentPromises: Promise<AnyQuestion[]>[] = [];

    // Process each question type in parallel
    if (questionsByType['single_selection']?.length) {
      enrichmentPromises.push(enrichSingleSelectionQuestions(questionsByType['single_selection']));
    }
    if (questionsByType['multi']?.length) {
      enrichmentPromises.push(enrichMultiChoiceQuestions(questionsByType['multi']));
    }
    if (questionsByType['drag_and_drop']?.length) {
      enrichmentPromises.push(enrichDragAndDropQuestions(questionsByType['drag_and_drop']));
    }
    if (questionsByType['dropdown_selection']?.length) {
      enrichmentPromises.push(enrichDropdownSelectionQuestions(questionsByType['dropdown_selection']));
    }
    if (questionsByType['order']?.length) {
      enrichmentPromises.push(enrichOrderQuestions(questionsByType['order']));
    }
    if (questionsByType['yes_no']?.length) {
      enrichmentPromises.push(enrichYesNoQuestions(questionsByType['yes_no']));
    }
    if (questionsByType['yesno_multi']?.length) {
      enrichmentPromises.push(enrichYesNoMultiQuestions(questionsByType['yesno_multi']));
    }

    // Wait for all enrichment operations to complete
    const enrichedQuestionArrays = await Promise.all(enrichmentPromises);

    // Flatten the arrays of enriched questions into a single array
    const allEnrichedQuestions = enrichedQuestionArrays.flat();

    if (baseQuestionsData.length !== allEnrichedQuestions.length) {
      console.warn(`Not all questions for quiz ${quizId} could be successfully enriched.`);
    }

    // Implement optimized randomization:
    // 1. First shuffle each question type independently to ensure even distribution
    const shuffledByType = enrichedQuestionArrays.map(typeArray => shuffleArray(typeArray));
    
    // 2. Then interleave questions from different types for variety
    const interleavedQuestions: AnyQuestion[] = [];
    const maxLength = Math.max(...shuffledByType.map(arr => arr.length));
    
    for (let i = 0; i < maxLength; i++) {
      // Add one question from each type (if available) at each iteration
      shuffledByType.forEach(typeArray => {
        if (i < typeArray.length) {
          interleavedQuestions.push(typeArray[i]);
        }
      });
    }
    
    // 3. Final shuffle to break any remaining patterns
    const finalShuffledQuestions = shuffleArray(interleavedQuestions);

    // Log randomization results for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎲 Quiz ${quizId} randomization results:`);
      console.log(`  Original question types:`, allEnrichedQuestions.map(q => `${q.type}`).join(', '));
      console.log(`  Randomized question types:`, finalShuffledQuestions.map(q => `${q.type}`).join(', '));
      console.log(`  Total questions shuffled: ${finalShuffledQuestions.length}`);
    }

    return {
      ...(quizData as Quiz),
      questions: finalShuffledQuestions,
    };

  } catch (error: any) {
    console.error(`Unexpected error in fetchQuizById for quiz ${quizId}:`, error.message || error);
    return null;
  }
}

/**
 * Fetches a random quiz question of a specified type, applying optional difficulty and tag filters.
 *
 * Selects up to 10 matching questions from the database, randomly chooses one, and enriches it with detailed data.
 *
 * @param type - The question type to filter by.
 * @param filters - Optional filters for difficulty and tags.
 * @returns The enriched random question, or `null` if none are found or an error occurs.
 */
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

/**
 * Returns a new array with the elements of the input array shuffled in random order.
 *
 * The original array is not modified.
 *
 * @param array - The array to shuffle.
 * @returns A new array containing the shuffled elements.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // Create a copy to avoid mutating the original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Groups an array of base questions by their type.
 *
 * @param questions - The list of base questions to group.
 * @returns An object mapping each question type to an array of questions of that type.
 */
export function groupQuestionsByType(questions: BaseQuestion[]): Record<string, BaseQuestion[]> {
  return questions.reduce((acc, q) => {
    if (!acc[q.type]) {
      acc[q.type] = [];
    }
    acc[q.type].push(q);
    return acc;
  }, {} as Record<string, BaseQuestion[]>);
}

/**
 * Enriches an array of base single selection questions with their options and correct answers.
 *
 * Fetches all related options and correct answer IDs in batch for the provided questions, returning fully constructed {@link SingleSelectionQuestion} objects. Questions with missing options or correct answers are excluded from the result.
 *
 * @param questions - The base questions to enrich.
 * @returns An array of enriched single selection questions.
 */
async function enrichSingleSelectionQuestions(questions: BaseQuestion[]): Promise<SingleSelectionQuestion[]> {
  if (!questions.length) return [];
  
  const questionIds = questions.map(q => q.id);
  
  try {
    // Fetch all options for these questions in one query
    const { data: optionsData, error: optionsError } = await supabase
      .from('single_selection_options')
      .select('option_id, text, question_id')
      .in('question_id', questionIds);

    if (optionsError) {
      console.error('Error fetching single selection options:', optionsError.message);
      return [];
    }

    // Fetch all correct answers in one query
    const { data: correctAnswersData, error: correctAnswersError } = await supabase
      .from('single_selection_correct_answer')
      .select('option_id, question_id')
      .in('question_id', questionIds);

    if (correctAnswersError) {
      console.error('Error fetching single selection correct answers:', correctAnswersError.message);
      return [];
    }

    // Group options by question_id
    const optionsByQuestion = optionsData?.reduce((acc, opt) => {
      if (!acc[opt.question_id]) {
        acc[opt.question_id] = [];
      }
      acc[opt.question_id].push({
        option_id: opt.option_id,
        text: opt.text,
      });
      return acc;
    }, {} as Record<string, SelectionOption[]>) || {};

    // Create a map of question_id to correct_option_id
    const correctAnswerMap = correctAnswersData?.reduce((acc, ans) => {
      acc[ans.question_id] = ans.option_id;
      return acc;
    }, {} as Record<string, string>) || {};

    // Build enriched questions
    return questions.map(q => {
      const options = optionsByQuestion[q.id] || [];
      const correctAnswerId = correctAnswerMap[q.id];

      if (!options.length || !correctAnswerId) {
        console.warn(`Incomplete data for single selection question ${q.id}`);
        return null;
      }

      return {
        ...q,
        type: 'single_selection',
        options,
        correctAnswerOptionId: correctAnswerId,
      } as SingleSelectionQuestion;
    }).filter(q => q !== null) as SingleSelectionQuestion[];

  } catch (error: any) {
    console.error('Error in enrichSingleSelectionQuestions:', error.message);
    return [];
  }
}

/**
 * Enriches an array of base multi-choice questions with their options and correct answers.
 *
 * Fetches all options and correct answer option IDs for the provided questions in batch, returning fully constructed {@link MultiChoiceQuestion} objects. Questions with incomplete data are omitted from the result.
 *
 * @param questions - The base questions to enrich.
 * @returns An array of enriched multi-choice questions.
 */
async function enrichMultiChoiceQuestions(questions: BaseQuestion[]): Promise<MultiChoiceQuestion[]> {
  if (!questions.length) return [];
  
  const questionIds = questions.map(q => q.id);
  
  try {
    // Fetch all options for these questions in one query
    const { data: optionsData, error: optionsError } = await supabase
      .from('multi_options')
      .select('option_id, text, question_id')
      .in('question_id', questionIds);

    if (optionsError) {
      console.error('Error fetching multi choice options:', optionsError.message);
      return [];
    }

    // Fetch all correct answers in one query
    const { data: correctAnswersData, error: correctAnswersError } = await supabase
      .from('multi_correct_answers')
      .select('option_id, question_id')
      .in('question_id', questionIds);

    if (correctAnswersError) {
      console.error('Error fetching multi choice correct answers:', correctAnswersError.message);
      return [];
    }

    // Group options by question_id
    const optionsByQuestion = optionsData?.reduce((acc, opt) => {
      if (!acc[opt.question_id]) {
        acc[opt.question_id] = [];
      }
      acc[opt.question_id].push({
        option_id: opt.option_id,
        text: opt.text,
      });
      return acc;
    }, {} as Record<string, SelectionOption[]>) || {};

    // Group correct answers by question_id
    const correctAnswersByQuestion = correctAnswersData?.reduce((acc, ans) => {
      if (!acc[ans.question_id]) {
        acc[ans.question_id] = [];
      }
      acc[ans.question_id].push(ans.option_id);
      return acc;
    }, {} as Record<string, string[]>) || {};

    // Build enriched questions
    return questions.map(q => {
      const options = optionsByQuestion[q.id] || [];
      const correctAnswerIds = correctAnswersByQuestion[q.id] || [];

      if (!options.length || !correctAnswerIds.length) {
        console.warn(`Incomplete data for multi choice question ${q.id}`);
        return null;
      }

      return {
        ...q,
        type: 'multi',
        options,
        correctAnswerOptionIds: correctAnswerIds,
      } as MultiChoiceQuestion;
    }).filter(q => q !== null) as MultiChoiceQuestion[];

  } catch (error: any) {
    console.error('Error in enrichMultiChoiceQuestions:', error.message);
    return [];
  }
}

/**
 * Enriches an array of base drag and drop questions with their targets, options, and correct pairs.
 *
 * Fetches all related targets, options, and correct answer pairs in batches for the provided questions.
 * Returns only questions with complete data; incomplete questions are omitted.
 *
 * @param questions - The base drag and drop questions to enrich.
 * @returns An array of fully enriched {@link DragAndDropQuestion} objects.
 */
async function enrichDragAndDropQuestions(questions: BaseQuestion[]): Promise<DragAndDropQuestion[]> {
  if (!questions.length) return [];
  
  const questionIds = questions.map(q => q.id);
  
  try {
    // Fetch all targets, options, and correct pairs in parallel
    const [targetsResult, optionsResult, correctPairsResult] = await Promise.all([
      supabase
        .from('drag_and_drop_targets')
        .select('target_id, text, question_id')
        .in('question_id', questionIds),
      supabase
        .from('drag_and_drop_options')
        .select('option_id, text, question_id')
        .in('question_id', questionIds),
      supabase
        .from('drag_and_drop_correct_pairs')
        .select('option_id, target_id, question_id')
        .in('question_id', questionIds)
    ]);

    if (targetsResult.error) {
      console.error('Error fetching drag and drop targets:', targetsResult.error.message);
      return [];
    }
    if (optionsResult.error) {
      console.error('Error fetching drag and drop options:', optionsResult.error.message);
      return [];
    }
    if (correctPairsResult.error) {
      console.error('Error fetching drag and drop correct pairs:', correctPairsResult.error.message);
      return [];
    }

    // Group data by question_id
    const targetsByQuestion = (targetsResult.data || []).reduce((acc, target) => {
      if (!acc[target.question_id]) {
        acc[target.question_id] = [];
      }
      acc[target.question_id].push({
        target_id: target.target_id,
        text: target.text,
      });
      return acc;
    }, {} as Record<string, DragAndDropTarget[]>);

    const optionsByQuestion = (optionsResult.data || []).reduce((acc, option) => {
      if (!acc[option.question_id]) {
        acc[option.question_id] = [];
      }
      acc[option.question_id].push({
        option_id: option.option_id,
        text: option.text,
      });
      return acc;
    }, {} as Record<string, DragAndDropOption[]>);

    const correctPairsByQuestion = (correctPairsResult.data || []).reduce((acc, pair) => {
      if (!acc[pair.question_id]) {
        acc[pair.question_id] = [];
      }
      acc[pair.question_id].push({
        option_id: pair.option_id,
        target_id: pair.target_id,
      });
      return acc;
    }, {} as Record<string, DragAndDropCorrectPair[]>);

    // Build enriched questions
    return questions.map(q => {
      const targets = targetsByQuestion[q.id] || [];
      const options = optionsByQuestion[q.id] || [];
      const correctPairs = correctPairsByQuestion[q.id] || [];

      if (!targets.length || !options.length || !correctPairs.length) {
        console.warn(`Incomplete data for drag and drop question ${q.id}`);
        return null;
      }

      return {
        ...q,
        type: 'drag_and_drop',
        targets,
        options,
        correctPairs,
      } as DragAndDropQuestion;
    }).filter(q => q !== null) as DragAndDropQuestion[];

  } catch (error: any) {
    console.error('Error in enrichDragAndDropQuestions:', error.message);
    return [];
  }
}

/**
 * Enriches an array of base dropdown selection questions with their options and placeholder targets.
 *
 * Fetches all related options and placeholder-to-correct-value mappings for each question in a single batch, returning fully constructed {@link DropdownSelectionQuestion} objects. Returns an empty array if input is empty or if data is incomplete.
 *
 * @param questions - The base dropdown selection questions to enrich.
 * @returns An array of enriched dropdown selection questions.
 */
async function enrichDropdownSelectionQuestions(questions: BaseQuestion[]): Promise<DropdownSelectionQuestion[]> {
  if (!questions.length) return [];
  
  const questionIds = questions.map(q => q.id);
  
  try {
    // Fetch all options and targets in parallel
    const [optionsResult, targetsResult] = await Promise.all([
      supabase
        .from('dropdown_selection_options')
        .select('option_id, text, is_correct, question_id')
        .in('question_id', questionIds),
      supabase
        .from('dropdown_selection_targets')
        .select('key, value, question_id')
        .in('question_id', questionIds)
    ]);

    if (optionsResult.error) {
      console.error('Error fetching dropdown selection options:', optionsResult.error.message);
      return [];
    }
    if (targetsResult.error) {
      console.error('Error fetching dropdown selection targets:', targetsResult.error.message);
      return [];
    }

    // Group data by question_id
    const optionsByQuestion = (optionsResult.data || []).reduce((acc, opt) => {
      if (!acc[opt.question_id]) {
        acc[opt.question_id] = [];
      }
      acc[opt.question_id].push({
        option_id: opt.option_id,
        text: opt.text,
        is_correct: opt.is_correct,
      });
      return acc;
    }, {} as Record<string, DropdownOption[]>);

    const targetsByQuestion = (targetsResult.data || []).reduce((acc, target) => {
      if (!acc[target.question_id]) {
        acc[target.question_id] = {};
      }
      acc[target.question_id][target.key] = {
        key: target.key,
        correctOptionText: target.value,
      };
      return acc;
    }, {} as Record<string, Record<string, DropdownPlaceholderTarget>>);

    // Build enriched questions
    return questions.map(q => {
      const options = optionsByQuestion[q.id] || [];
      const placeholderTargets = targetsByQuestion[q.id] || {};

      if (!options.length || Object.keys(placeholderTargets).length === 0) {
        console.warn(`Incomplete data for dropdown selection question ${q.id}`);
        return null;
      }

      return {
        ...q,
        type: 'dropdown_selection',
        options,
        placeholderTargets,
      } as DropdownSelectionQuestion;
    }).filter(q => q !== null) as DropdownSelectionQuestion[];

  } catch (error: any) {
    console.error('Error in enrichDropdownSelectionQuestions:', error.message);
    return [];
  }
}

/**
 * Enriches an array of base order questions with their items and correct order sequence.
 *
 * Fetches all related items and correct order data in batches for the provided questions. Returns only those questions for which both items and correct order are available.
 *
 * @param questions - The base order questions to enrich.
 * @returns An array of enriched {@link OrderQuestion} objects.
 */
async function enrichOrderQuestions(questions: BaseQuestion[]): Promise<OrderQuestion[]> {
  if (!questions.length) return [];
  
  const questionIds = questions.map(q => q.id);
  
  try {
    // Fetch items and correct order in parallel
    const [itemsResult, correctOrderResult] = await Promise.all([
      supabase
        .from('order_items')
        .select('item_id, text, question_id')
        .in('question_id', questionIds),
      supabase
        .from('order_correct_order')
        .select('item_id, position, question_id')
        .in('question_id', questionIds)
    ]);

    if (itemsResult.error) {
      console.error('Error fetching order items:', itemsResult.error.message);
      return [];
    }
    if (correctOrderResult.error) {
      console.error('Error fetching order correct sequence:', correctOrderResult.error.message);
      return [];
    }

    // Group items by question_id
    const itemsByQuestion = (itemsResult.data || []).reduce((acc, item) => {
      if (!acc[item.question_id]) {
        acc[item.question_id] = [];
      }
      acc[item.question_id].push({
        item_id: item.item_id,
        text: item.text,
      });
      return acc;
    }, {} as Record<string, OrderItem[]>);

    // Group and sort correct order by question_id
    const correctOrderByQuestion = (correctOrderResult.data || []).reduce((acc, order) => {
      if (!acc[order.question_id]) {
        acc[order.question_id] = [];
      }
      acc[order.question_id].push({
        item_id: order.item_id,
        position: order.position,
      });
      return acc;
    }, {} as Record<string, { item_id: string; position: number }[]>);

    // Sort the correct order arrays by position and extract item_ids
    for (const questionId in correctOrderByQuestion) {
      correctOrderByQuestion[questionId].sort((a, b) => a.position - b.position);
    }
    const sortedCorrectOrderByQuestion = Object.fromEntries(
      Object.entries(correctOrderByQuestion).map(([questionId, orderArray]) => [
        questionId,
        orderArray.map(item => item.item_id)
      ])
    );

    // Build enriched questions
    return questions.map(q => {
      const items = itemsByQuestion[q.id] || [];
      const correctOrder = sortedCorrectOrderByQuestion[q.id] || [];

      if (!items.length || !correctOrder.length) {
        console.warn(`Incomplete data for order question ${q.id}`);
        return null;
      }

      return {
        ...q,
        type: 'order',
        items,
        correctOrder,
      } as OrderQuestion;
    }).filter(q => q !== null) as OrderQuestion[];

  } catch (error: any) {
    console.error('Error in enrichOrderQuestions:', error.message);
    return [];
  }
}

/**
 * Enriches an array of base yes/no questions with their correct answers.
 *
 * Fetches correct answers for all provided questions in a single batch query and constructs fully detailed {@link YesNoQuestion} objects. Questions without a corresponding correct answer are skipped.
 *
 * @param questions - The base yes/no questions to enrich.
 * @returns An array of enriched {@link YesNoQuestion} objects.
 */
async function enrichYesNoQuestions(questions: BaseQuestion[]): Promise<YesNoQuestion[]> {
  if (!questions.length) return [];
  
  const questionIds = questions.map(q => q.id);
  
  try {
    // Fetch all correct answers in one query
    const { data: correctAnswersData, error: correctAnswersError } = await supabase
      .from('yes_no_answer')
      .select('question_id, correct_answer')
      .in('question_id', questionIds);

    if (correctAnswersError) {
      console.error('Error fetching yes/no answers:', correctAnswersError.message);
      return [];
    }

    // Create a map of question_id to correct_answer
    const correctAnswerMap = (correctAnswersData || []).reduce((acc, ans) => {
      acc[ans.question_id] = ans.correct_answer;
      return acc;
    }, {} as Record<string, boolean>);

    // Build enriched questions
    return questions.map(q => {
      const correctAnswer = correctAnswerMap[q.id];

      if (correctAnswer === undefined) {
        console.warn(`No correct answer found for yes/no question ${q.id}`);
        return null;
      }

      return {
        ...q,
        type: 'yes_no',
        correctAnswer,
      } as YesNoQuestion;
    }).filter(q => q !== null) as YesNoQuestion[];

  } catch (error: any) {
    console.error('Error in enrichYesNoQuestions:', error.message);
    return [];
  }
}

/**
 * Enriches an array of base yes/no multi-statement questions with their statements and correct answers.
 *
 * Fetches all statements and corresponding correct answers for each question in a single batch, returning fully constructed {@link YesNoMultiQuestion} objects. If data is incomplete for a question, it is skipped.
 *
 * @param questions - The base yes/no multi-statement questions to enrich.
 * @returns An array of enriched {@link YesNoMultiQuestion} objects. Returns an empty array if input is empty or on error.
 */
async function enrichYesNoMultiQuestions(questions: BaseQuestion[]): Promise<YesNoMultiQuestion[]> {
  if (!questions.length) return [];
  
  const questionIds = questions.map(q => q.id);
  
  try {
    // Fetch statements and correct answers in parallel
    const [statementsResult, correctAnswersResult] = await Promise.all([
      supabase
        .from('yesno_multi_statements')
        .select('statement_id, text, question_id')
        .in('question_id', questionIds),
      supabase
        .from('yesno_multi_correct_answers')
        .select('statement_id, correct_answer, question_id')
        .in('question_id', questionIds)
    ]);

    if (statementsResult.error) {
      console.error('Error fetching yesno_multi statements:', statementsResult.error.message);
      return [];
    }
    if (correctAnswersResult.error) {
      console.error('Error fetching yesno_multi correct answers:', correctAnswersResult.error.message);
      return [];
    }

    // Group statements by question_id
    const statementsByQuestion = (statementsResult.data || []).reduce((acc, stmt) => {
      if (!acc[stmt.question_id]) {
        acc[stmt.question_id] = [];
      }
      acc[stmt.question_id].push({
        statement_id: stmt.statement_id,
        text: stmt.text,
      });
      return acc;
    }, {} as Record<string, YesNoStatement[]>);

    // Group correct answers by question_id
    const correctAnswersByQuestion = (correctAnswersResult.data || []).reduce((acc, ans) => {
      if (!acc[ans.question_id]) {
        acc[ans.question_id] = new Map<string, boolean>();
      }
      acc[ans.question_id].set(ans.statement_id, ans.correct_answer);
      return acc;
    }, {} as Record<string, Map<string, boolean>>);

    // Build enriched questions
    return questions.map(q => {
      const statements = statementsByQuestion[q.id] || [];
      const correctAnswersMap = correctAnswersByQuestion[q.id];

      if (!statements.length || !correctAnswersMap) {
        console.warn(`Incomplete data for yesno_multi question ${q.id}`);
        return null;
      }

      // Sort statements by statement_id
      statements.sort((a, b) => a.statement_id.localeCompare(b.statement_id));

      // Create the correctAnswers array matching the statements order
      const correctAnswers = statements.map(stmt => 
        correctAnswersMap.get(stmt.statement_id) || false
      );

      if (correctAnswers.length !== statements.length) {
        console.warn(`Mismatch between statements and correct answers for yesno_multi question ${q.id}`);
        return null;
      }

      return {
        ...q,
        type: 'yesno_multi',
        statements,
        correctAnswers,
      } as YesNoMultiQuestion;
    }).filter(q => q !== null) as YesNoMultiQuestion[];

  } catch (error: any) {
    console.error('Error in enrichYesNoMultiQuestions:', error.message);
    return [];
  }
}

/**
 * Retrieves all quizzes from the database.
 *
 * @returns An array of all quizzes, or an empty array if an error occurs.
 */
export async function fetchAllQuizzes(): Promise<Quiz[]> {
  try {
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('*');

    if (error) {
      console.error('Error fetching quizzes:', error.message);
      return [];
    }

    return quizzes || [];
  } catch (error: any) {
    console.error('Unexpected error fetching quizzes:', error.message);
    return [];
  }
}
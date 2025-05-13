Okay, let's implement the dropdown_selection question type.

Here's the plan:

Update app/types/quiz.ts:

Define DropdownOption and DropdownPlaceholderTarget interfaces.

Define the DropdownSelectionQuestion interface extending BaseQuestion.

Add DropdownSelectionQuestion to the AnyQuestion union type.

Update app/lib/supabaseQuizService.ts:

In enrichQuestionWithDetails, add a case for dropdown_selection.

Fetch data from dropdown_selection_options and dropdown_selection_targets.

Populate the options and placeholderTargets fields of the DropdownSelectionQuestion object.

Create app/features/quiz/components/question-types/DropdownSelectionComponent.tsx:

This component will render the question text containing placeholders (e.g., [placeholder_key]).

It will parse the question text to identify these placeholders.

For each placeholder, it will render a <select> dropdown.

Each dropdown will be populated with all options from question.options.

It will manage the user's selections for each dropdown.

When an answer changes, it will call onAnswerSelect with an object mapping placeholder keys to the selected option's text (e.g., {"placeholder1": "selected_text_for_placeholder1"}).

It will apply feedback styling (correct/incorrect) to each dropdown based on isSubmitted and showCorrectAnswer flags, comparing the selected text against question.placeholderTargets.

Update app/features/quiz/components/question-types/QuestionTypeRenderer.tsx:

Add a case for dropdown_selection to render the DropdownSelectionComponent.

Update app/features/quiz/hooks/useQuizState.ts:

In the quizReducer for the SUBMIT_ANSWER action, add logic for dropdown_selection to perform client-side validation if possible.

The answer payload will be Record<string, string> (placeholder key to selected option text).

Compare this with question.placeholderTargets to determine isClientCorrect.

Update QuizPage.tsx (app/features/quiz/pages/QuizPage.tsx):

Add dropdown_selection to the availableQuestionTypes array for filtering UI.

Update app/question-types/page.tsx:

Mark dropdown_selection as available.

Update app/question-types-demo/[type]/page.tsx:

Ensure it can correctly fetch and render a dropdown_selection question using DropdownSelectionComponent.

Let's start with the type definitions.

// app/types/quiz.ts
export type QuestionType =
  | 'drag_and_drop'
  | 'dropdown_selection'
  | 'multi'
  | 'single_selection'
  | 'order'
  | 'yes_no'
  | 'yesno_multi';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface BaseQuestion {
  id: string; // UUID
  type: QuestionType;
  question: string; // For dropdown_selection, this string will contain placeholders like [key]
  points: number;
  quiz_tag: string; // Corresponds to Quiz.id
  difficulty: Difficulty;
  explanation?: string | null;
  feedback_correct: string;
  feedback_incorrect: string;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface SelectionOption {
  option_id: string;
  text: string;
}

export interface SingleSelectionQuestion extends BaseQuestion {
  type: 'single_selection';
  options: SelectionOption[];
  correctAnswerOptionId: string; 
}

export interface MultiChoiceQuestion extends BaseQuestion {
  type: 'multi';
  options: SelectionOption[];
  correctAnswerOptionIds: string[];
}

export interface DragAndDropTarget {
  target_id: string;
  text: string;
}

export interface DragAndDropOption {
  option_id: string;
  text: string;
}

export interface DragAndDropCorrectPair {
  option_id: string;
  target_id: string;
}

export interface DragAndDropQuestion extends BaseQuestion {
  type: 'drag_and_drop';
  targets: DragAndDropTarget[];
  options: DragAndDropOption[];
  correctPairs: DragAndDropCorrectPair[];
}

// Types for DropdownSelectionQuestion
export interface DropdownOption {
  option_id: string;
  text: string;
  is_correct: boolean; // As per DB schema and migration script
}

export interface DropdownPlaceholderTarget {
  key: string; // The placeholder name in the question text, e.g., "option_set1"
  correctOptionText: string; // The TEXT content of the correct option for this placeholder
}

export interface DropdownSelectionQuestion extends BaseQuestion {
  type: 'dropdown_selection';
  // question: string; // Inherited from BaseQuestion, contains text with placeholders like [key]
  options: DropdownOption[]; // All available options for any dropdown in this question
  placeholderTargets: DropdownPlaceholderTarget[]; // Defines the correct text for each placeholder
}


// AnyQuestion will be a union of all specific question types
export type AnyQuestion = 
  | SingleSelectionQuestion 
  | MultiChoiceQuestion 
  | DragAndDropQuestion
  | DropdownSelectionQuestion; // Added DropdownSelectionQuestion

export interface Quiz {
  id: string; // e.g. azure-a102
  title: string;
  description?: string | null;
  quiz_type?: string | null;
  settings?: Record<string, any> | null; // JSONB
  author?: string | null;
  difficulty: Difficulty;
  quiz_topic: string; // Usually same as id
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  questions: AnyQuestion[];
}


Next, update app/lib/supabaseQuizService.ts.

// app/lib/supabaseQuizService.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  BaseQuestion, 
  AnyQuestion, 
  SingleSelectionQuestion, 
  MultiChoiceQuestion,
  SelectionOption as SingleMultiSelectionOption, // Renamed to avoid conflict
  DragAndDropTarget,
  DragAndDropOption,
  DragAndDropCorrectPair,
  DragAndDropQuestion,
  DropdownSelectionQuestion, // New
  DropdownOption,            // New
  DropdownPlaceholderTarget, // New
  Quiz
} from '../types/quiz';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rvwvnralrlsdtugtgict.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2d3ZucmFscmxzZHR1Z3RnaWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTQ0NzM0NCwiZXhwIjoyMDYxMDIzMzQ0fQ.hFRjn5zq24WmKEoCLbWDRUY6dUdEjlPS-c4OemCaFM4";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // In a server environment, this would typically throw an error or log a critical failure.
  // For client-side usage (like in `quizService.ts` which is client-side), 
  // NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY should be used.
  // This service (`supabaseQuizService.ts`) appears to be intended for server-side use (e.g. API routes, RSCs).
  console.error('Supabase URL or Service Role Key is not defined in environment variables. This service is intended for server-side execution.');
  // throw new Error('Supabase URL or Service Role Key is not defined in environment variables.');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false } 
});

export async function enrichQuestionWithDetails(
  baseQuestion: BaseQuestion
): Promise<AnyQuestion | null> {
  if (baseQuestion.type === 'single_selection') {
    try {
      const { data: optionsData, error: optionsError } = await supabase
        .from('single_selection_options')
        .select('option_id, text')
        .eq('question_id', baseQuestion.id);

      if (optionsError) throw optionsError;

      const { data: correctAnswerData, error: correctAnswerError } = await supabase
        .from('single_selection_correct_answer')
        .select('option_id')
        .eq('question_id', baseQuestion.id)
        .single();

      if (correctAnswerError) throw correctAnswerError;
      if (!correctAnswerData) throw new Error(`No correct answer found for single_selection question ${baseQuestion.id}`);
      
      const typedOptions: SingleMultiSelectionOption[] = (optionsData || []).map((opt: any) => ({
        option_id: opt.option_id,
        text: opt.text,
      }));

      return {
        ...baseQuestion,
        type: 'single_selection',
        options: typedOptions,
        correctAnswerOptionId: correctAnswerData.option_id,
      };
    } catch (error: any) {
      console.error(`Error enriching single_selection question ${baseQuestion.id}:`, error.message || error);
      return null;
    }
  } else if (baseQuestion.type === 'multi') {
    try {
      const { data: optionsData, error: optionsError } = await supabase
        .from('multi_options')
        .select('option_id, text')
        .eq('question_id', baseQuestion.id);
      if (optionsError) throw optionsError;

      const { data: correctAnswersData, error: correctAnswersError } = await supabase
        .from('multi_correct_answers')
        .select('option_id')
        .eq('question_id', baseQuestion.id);
      if (correctAnswersError) throw correctAnswersError;

      const typedOptions: SingleMultiSelectionOption[] = (optionsData || []).map((opt: any) => ({
        option_id: opt.option_id,
        text: opt.text,
      }));
      const correctAnswerOptionIds = (correctAnswersData || []).map((ans: any) => ans.option_id);

      if (!correctAnswerOptionIds.length) {
        console.warn(`No correct answer options found for multi question ${baseQuestion.id}`);
        return null;
      }
      
      return {
        ...baseQuestion,
        type: 'multi',
        options: typedOptions,
        correctAnswerOptionIds,
      };
    } catch (error: any) {
      console.error(`Error enriching multi question ${baseQuestion.id}:`, error.message || error);
      return null;
    }
  } else if (baseQuestion.type === 'drag_and_drop') {
    try {
      const { data: targetsData, error: targetsError } = await supabase
        .from('drag_and_drop_targets')
        .select('target_id, text')
        .eq('question_id', baseQuestion.id);
      if (targetsError) throw targetsError;

      const { data: optionsData, error: optionsError } = await supabase
        .from('drag_and_drop_options')
        .select('option_id, text')
        .eq('question_id', baseQuestion.id);
      if (optionsError) throw optionsError;

      const { data: correctPairsData, error: correctPairsError } = await supabase
        .from('drag_and_drop_correct_pairs')
        .select('option_id, target_id')
        .eq('question_id', baseQuestion.id);
      if (correctPairsError) throw correctPairsError;

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

      if (!typedTargets.length || !typedOptions.length || !typedCorrectPairs.length) {
        console.warn(`Missing data for drag_and_drop question ${baseQuestion.id}`);
        return null;
      }

      return {
        ...baseQuestion,
        type: 'drag_and_drop',
        targets: typedTargets,
        options: typedOptions,
        correctPairs: typedCorrectPairs,
      };
    } catch (error: any) {
      console.error(`Error enriching drag_and_drop question ${baseQuestion.id}:`, error.message || error);
      return null;
    }
  } else if (baseQuestion.type === 'dropdown_selection') { // New case
    try {
      const { data: optionsData, error: optionsError } = await supabase
        .from('dropdown_selection_options')
        .select('option_id, text, is_correct')
        .eq('question_id', baseQuestion.id);
      if (optionsError) throw optionsError;

      const { data: targetsData, error: targetsError } = await supabase
        .from('dropdown_selection_targets')
        .select('key, value') // 'value' is the correctOptionText
        .eq('question_id', baseQuestion.id);
      if (targetsError) throw targetsError;

      const typedOptions: DropdownOption[] = (optionsData || []).map((opt: any) => ({
        option_id: opt.option_id,
        text: opt.text,
        is_correct: opt.is_correct,
      }));

      const typedPlaceholderTargets: DropdownPlaceholderTarget[] = (targetsData || []).map((target: any) => ({
        key: target.key,
        correctOptionText: target.value,
      }));

      if (!typedOptions.length) {
        console.warn(`No options found for dropdown_selection question ${baseQuestion.id}`);
        // This might be acceptable if the question is malformed, but generally options are needed.
        // Depending on strictness, you might return null or an empty options array.
        // For now, let's allow it but log a warning.
      }
      if (!typedPlaceholderTargets.length) {
        console.warn(`No placeholder targets found for dropdown_selection question ${baseQuestion.id}`);
        return null; // Placeholders are essential for this question type.
      }
      
      return {
        ...baseQuestion,
        type: 'dropdown_selection',
        options: typedOptions,
        placeholderTargets: typedPlaceholderTargets,
      };
    } catch (error: any) {
      console.error(`Error enriching dropdown_selection question ${baseQuestion.id}:`, error.message || error);
      return null;
    }
  } else {
    console.warn(`enrichQuestionWithDetails: Unhandled question type '${baseQuestion.type}' for Q ID ${baseQuestion.id}.`);
    // Fallback to BaseQuestion if type is unhandled but still want to return something
    // return baseQuestion as AnyQuestion; 
    // Or return null if strict enrichment is required:
    return null;
  }
}

export async function fetchQuizById(
  quizId: string,
  questionType?: string
): Promise<Quiz | null> {
  try {
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizError) {
      if (quizError.code === 'PGRST116') {
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

    let query = supabase
      .from('questions')
      .select('*')
      .eq('quiz_tag', quizId);
      
    if (questionType) {
      query = query.eq('type', questionType);
    }
    
    const { data: baseQuestionsData, error: questionsError } = await query;

    if (questionsError) {
      console.error(`Error fetching questions for quiz ${quizId}:`, questionsError.message);
      return null;
    }

    const enrichedQuestionsPromises = (baseQuestionsData || []).map(bq => 
      enrichQuestionWithDetails(bq as BaseQuestion)
    );
    const resolvedQuestions = await Promise.all(enrichedQuestionsPromises);
    const successfullyEnrichedQuestions = resolvedQuestions.filter(q => q !== null) as AnyQuestion[];

    if (baseQuestionsData && successfullyEnrichedQuestions.length !== baseQuestionsData.length) {
      console.warn(`Not all questions for quiz ${quizId} could be successfully enriched. Original: ${baseQuestionsData.length}, Enriched: ${successfullyEnrichedQuestions.length}`);
    }

    return {
      ...(quizData as Quiz),
      questions: successfullyEnrichedQuestions,
    };

  } catch (error: any) {
    console.error(`Unexpected error in fetchQuizById for quiz ${quizId}:`, error.message || error);
    return null;
  }
}

export async function fetchRandomQuestionByTypeAndFilters(
  type: string,
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
      query = query.in('quiz_tag', filters.tags);
    }

    query = query.limit(10); 

    const { data: baseQuestionsData, error: questionsError } = await query;

    if (questionsError) {
      console.error(`Error fetching questions by type ${type} and filters:`, questionsError.message);
      return null;
    }

    if (!baseQuestionsData || baseQuestionsData.length === 0) {
      console.warn(`No questions found for type ${type} with current filters.`);
      return null;
    }

    const randomIndex = Math.floor(Math.random() * baseQuestionsData.length);
    const randomBaseQuestion = baseQuestionsData[randomIndex] as BaseQuestion;

    if (!randomBaseQuestion) {
      return null;
    }
    
    return await enrichQuestionWithDetails(randomBaseQuestion);

  } catch (error: any) {
    console.error(`Unexpected error in fetchRandomQuestionByTypeAndFilters for type ${type}:`, error.message || error);
    return null;
  }
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END

Now, create app/features/quiz/components/question-types/DropdownSelectionComponent.tsx.

// app/features/quiz/components/question-types/DropdownSelectionComponent.tsx
'use client';

import React, { useState, useEffect, memo, useMemo } from 'react';
import { DropdownSelectionQuestion, DropdownOption } from '../../../../types/quiz';

interface DropdownSelectionComponentProps {
  question: DropdownSelectionQuestion;
  onAnswerSelect: (answers: Record<string, string | null>) => void; // Maps placeholder key to selected option text
  selectedAnswer?: Record<string, string | null>; // Previously selected answers for each placeholder
  isSubmitted?: boolean;
  showCorrectAnswer?: boolean; // For styling after submission or in review mode
}

// Helper to parse question text and extract segments and placeholders
const parseQuestionText = (text: string): (string | { placeholder: string })[] => {
  const parts: (string | { placeholder: string })[] = [];
  const regex = /\[([^\]]+)\]/g; // Matches [placeholder_key]
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push({ placeholder: match[1] }); // match[1] is the placeholder key
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts;
};


const DropdownSelectionComponent: React.FC<DropdownSelectionComponentProps> = ({
  question,
  onAnswerSelect,
  selectedAnswer,
  isSubmitted = false,
  showCorrectAnswer = false,
}) => {
  // Initialize local state for selections. Each key is a placeholder, value is the selected option's TEXT.
  const initialSelections: Record<string, string | null> = useMemo(() => {
    const init: Record<string, string | null> = {};
    question.placeholderTargets.forEach(target => {
      init[target.key] = selectedAnswer?.[target.key] || null;
    });
    return init;
  }, [question.placeholderTargets, selectedAnswer]);
  
  const [currentSelections, setCurrentSelections] = useState<Record<string, string | null>>(initialSelections);

  // Update local state if external selectedAnswer changes (e.g., loading from context)
  useEffect(() => {
    const newSelections: Record<string, string | null> = {};
    question.placeholderTargets.forEach(target => {
      newSelections[target.key] = selectedAnswer?.[target.key] || null;
    });
    setCurrentSelections(newSelections);
  }, [selectedAnswer, question.placeholderTargets]);


  const handleSelectionChange = (placeholderKey: string, selectedOptionText: string) => {
    if (isSubmitted) return;

    const newSelections = {
      ...currentSelections,
      [placeholderKey]: selectedOptionText,
    };
    setCurrentSelections(newSelections);
    onAnswerSelect(newSelections); // Notify parent about the change
  };

  const questionParts = useMemo(() => parseQuestionText(question.question), [question.question]);

  const defaultOption = { option_id: "", text: "Select...", is_correct: false };

  return (
    <div className="dropdown-selection-container text-lg leading-relaxed">
      {questionParts.map((part, index) => {
        if (typeof part === 'string') {
          // Handle newlines in text segments correctly for pre-wrap
          return part.split('\n').map((line, lineIndex) => (
            <React.Fragment key={`${index}-${lineIndex}`}>
              {lineIndex > 0 && <br />}
              {line}
            </React.Fragment>
          ));
        } else {
          const placeholderKey = part.placeholder;
          const currentSelectedText = currentSelections[placeholderKey];
          
          let borderColor = 'border-gray-300';
          if (showCorrectAnswer && isSubmitted) {
            const correctTarget = question.placeholderTargets.find(t => t.key === placeholderKey);
            if (correctTarget) {
              borderColor = currentSelectedText === correctTarget.correctOptionText ? 'border-green-500' : 'border-red-500';
            }
          } else if (currentSelectedText) {
            borderColor = 'border-blue-500'; // Indicate selection before submission
          }

          return (
            <select
              key={`${index}-${placeholderKey}`}
              value={currentSelectedText || ""} // Use empty string for "Select..." option
              onChange={(e) => handleSelectionChange(placeholderKey, e.target.value)}
              disabled={isSubmitted}
              className={`mx-1 px-2 py-1 border-2 ${borderColor} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white shadow-sm text-base`}
              aria-label={`Selection for ${placeholderKey}`}
            >
              <option value="" disabled={!currentSelectedText || currentSelectedText === ""}>
                Select...
              </option>
              {question.options.map((opt: DropdownOption) => (
                <option key={opt.option_id} value={opt.text}>
                  {opt.text}
                </option>
              ))}
            </select>
          );
        }
      })}
    </div>
  );
};

export default memo(DropdownSelectionComponent);
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Tsx
IGNORE_WHEN_COPYING_END

Update QuestionTypeRenderer.tsx.

// app/features/quiz/components/question-types/QuestionTypeRenderer.tsx
import React, { memo } from 'react';
import { 
  AnyQuestion, 
  SingleSelectionQuestion, 
  MultiChoiceQuestion, 
  DragAndDropQuestion,
  DropdownSelectionQuestion // New
} from '../../../../types/quiz';
import SingleSelectionComponent from './SingleSelectionComponent';
import MultiChoiceComponent from './MultiChoiceComponent';
import DragAndDropQuestionComponent from './DragAndDropQuestionComponent';
import DropdownSelectionComponent from './DropdownSelectionComponent'; // New

interface QuestionTypeRendererProps {
  question: AnyQuestion;
  onAnswerSelect: (answer: any) => void;
  selectedAnswer: any;
  isSubmitted: boolean;
  shouldApplyFeedbackStyling: boolean;
  isQuizReviewMode: boolean;
}

const QuestionTypeRenderer: React.FC<QuestionTypeRendererProps> = ({
  question,
  onAnswerSelect,
  selectedAnswer,
  isSubmitted,
  shouldApplyFeedbackStyling,
  isQuizReviewMode,
}) => {
  if (!question || !question.type) {
    return (
      <div className="p-4 my-4 border border-red-200 rounded bg-red-50">
        <p className="font-semibold text-red-700">Error: Invalid question object</p>
      </div>
    );
  }

  switch (question.type) {
    case 'single_selection':
      return (
        <SingleSelectionComponent 
          question={question as SingleSelectionQuestion} 
          onAnswerSelect={onAnswerSelect}
          selectedOptionId={selectedAnswer as string | undefined}
          isSubmitted={isSubmitted}
          showCorrectAnswer={shouldApplyFeedbackStyling}
        />
      );
    case 'multi':
      return (
        <MultiChoiceComponent
          question={question as MultiChoiceQuestion}
          onAnswerSelect={onAnswerSelect}
          selectedOptionIds={selectedAnswer as string[] | undefined}
          isSubmitted={isSubmitted}
          showCorrectAnswer={shouldApplyFeedbackStyling}
        />
      );
    case 'drag_and_drop':
      return (
        <DragAndDropQuestionComponent
          question={question as DragAndDropQuestion}
          onAnswerChange={onAnswerSelect} // Prop name is onAnswerChange for D&D
          userAnswer={selectedAnswer as Record<string, string | null> | undefined}
          isSubmitted={isSubmitted}
          showFeedbackStyling={shouldApplyFeedbackStyling}
          isQuizReviewMode={isQuizReviewMode}
          validateOnDrop={true}
        />
      );
    case 'dropdown_selection': // New case
      return (
        <DropdownSelectionComponent
          question={question as DropdownSelectionQuestion}
          onAnswerSelect={onAnswerSelect}
          selectedAnswer={selectedAnswer as Record<string, string | null> | undefined}
          isSubmitted={isSubmitted}
          showCorrectAnswer={shouldApplyFeedbackStyling}
        />
      );
    // TODO: Add cases for 'order', 'yes_no', 'yesno_multi'
    default:
      const unhandledQuestion: any = question;
      return (
        <div className="p-4 my-4 border border-yellow-300 rounded bg-yellow-50">
          <p className="font-semibold text-yellow-700">
            Question type component for "{unhandledQuestion?.type}" is not yet implemented.
          </p>
        </div>
      );
  }
};

export default memo(QuestionTypeRenderer);
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Tsx
IGNORE_WHEN_COPYING_END

Update app/features/quiz/hooks/useQuizState.ts for client-side validation.

// app/features/quiz/hooks/useQuizState.ts
import { useReducer } from 'react';
import { AnyQuestion, Quiz, QuestionType, DropdownSelectionQuestion, DropdownPlaceholderTarget } from '../../../types/quiz'; // Added DropdownSelectionQuestion and DropdownPlaceholderTarget

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
        // Optional fields for client-side validation hint
        correctAnswerOptionId?: string; // For single_selection
        correctAnswerOptionIds?: string[]; // For multi
        placeholderTargets?: DropdownPlaceholderTarget[]; // For dropdown_selection
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
      const currentQuestionForSubmit = state.questions.find(q => q.id === action.payload.questionId);
      
      if (action.payload.questionType === 'single_selection' && currentQuestionForSubmit?.type === 'single_selection') {
        isClientCorrect = action.payload.answer === (currentQuestionForSubmit as SingleSelectionQuestion).correctAnswerOptionId;
      } else if (action.payload.questionType === 'multi' && currentQuestionForSubmit?.type === 'multi') {
        const selectedAnswers = action.payload.answer as string[];
        const correctAnswers = (currentQuestionForSubmit as MultiChoiceQuestion).correctAnswerOptionIds;
        isClientCorrect = 
          selectedAnswers.length === correctAnswers.length && 
          selectedAnswers.every(id => correctAnswers.includes(id)) &&
          correctAnswers.every(id => selectedAnswers.includes(id));
      } else if (action.payload.questionType === 'drag_and_drop') {
        // Server-side validation is primary for drag_and_drop
        isClientCorrect = undefined; 
      } else if (action.payload.questionType === 'dropdown_selection' && currentQuestionForSubmit?.type === 'dropdown_selection') {
        const userSelections = action.payload.answer as Record<string, string | null>;
        const correctTargets = (currentQuestionForSubmit as DropdownSelectionQuestion).placeholderTargets;
        
        if (Object.keys(userSelections).length !== correctTargets.length) {
          isClientCorrect = false; // Must answer all dropdowns
        } else {
          isClientCorrect = correctTargets.every(target => 
            userSelections[target.key] === target.correctOptionText
          );
        }
      }

      return {
        ...state,
        userAnswers: {
          ...state.userAnswers,
          [action.payload.questionId]: {
            answer: action.payload.answer,
            isCorrect: isClientCorrect, // Store client-side assessment, may be overridden by server
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
            // serverVerifiedCorrectAnswer can be stored if needed for review mode display
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
      // This action might be redundant if feedback is shown on submit,
      // but could be used for explicitly revealing feedback.
      return { ...state, showFeedbackForCurrentQuestion: true };

    case 'RESET_QUIZ':
      return initialState;
      
    default:
      return state;
  }
};

export const useQuizState = () => {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  
  return {
    state,
    dispatch
  };
};
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END

Modify useQuizScoring.ts to pass placeholderTargets for dropdown_selection if needed for client-side validation hint in useQuizState. However, the primary validation for dropdown_selection can also happen on the server. For now, let's assume the client-side validation in useQuizState uses the placeholderTargets directly from the currentQuestionForSubmit object, so no change needed in useQuizScoring for this.

Update app/features/quiz/pages/QuizPage.tsx for filter UI.

// app/features/quiz/pages/QuizPage.tsx
// ... (imports)

// Quiz Runner Component
// ... (existing code)

// ... inside return for QuizPageContent, in the filter links section:
// (add after Drag and Drop Link)
                <Link 
                  href={`/quiz-test/${quizId}/dropdown_selection`}
                  className={`px-3 py-1 rounded-full text-sm ${questionType === 'dropdown_selection' ? 'bg-custom-primary text-white' : 'bg-gray-200'}`}
                >
                  Dropdown
                </Link>
// ... (rest of the component)


export default QuizPage;

// Define list of available question types for easy import elsewhere
// THIS IS THE OLD LIST. THE COMPONENT NOW USES THIS.
// KEEPING THIS EXPORTED ARRAY BUT IT MIGHT NOT BE USED BY QuizPage DIRECTLY FOR FILTERS.
// The filters in QuizPage are hardcoded links.
export const availableQuestionTypes = [
  { type: 'single_selection', name: 'Single Selection' },
  { type: 'multi', name: 'Multiple Selection' },
  { type: 'drag_and_drop', name: 'Drag and Drop' },
  { type: 'dropdown_selection', name: 'Dropdown' }, // Added
  { type: 'order', name: 'Order' }
  // { type: 'yes_no', name: 'Yes/No' },
  // { type: 'yesno_multi', name: 'Multiple Yes/No' }
];
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END

Update app/question-types/page.tsx to mark dropdown_selection as available.

// app/question-types/page.tsx
// ... (imports)

const QuestionTypesPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<QuestionType | null>(null);
  
  const availableTypes: Array<{
    type: QuestionType;
    name: string;
    description: string;
    available: boolean; // This flag controls UI availability
  }> = [
    {
      type: 'single_selection',
      name: 'Single Selection',
      description: 'User selects one correct answer from multiple choices.',
      available: true
    },
    {
      type: 'multi',
      name: 'Multiple Selection',
      description: 'User selects multiple correct answers from multiple choices.',
      available: true
    },
    {
      type: 'drag_and_drop',
      name: 'Drag and Drop',
      description: 'User matches items by dragging them to their corresponding targets.',
      available: true // Assuming this is also ready based on existing code
    },
    {
      type: 'dropdown_selection',
      name: 'Dropdown Selection',
      description: 'User selects answers from dropdown menus within text.',
      available: true // Marking as available
    },
    {
      type: 'order',
      name: 'Ordering',
      description: 'User arranges items in the correct sequence.',
      available: false // Or true if implemented
    },
    {
      type: 'yes_no',
      name: 'Yes/No',
      description: 'User answers a question with yes or no.',
      available: false // Or true if implemented
    },
    {
      type: 'yesno_multi',
      name: 'Multiple Yes/No',
      description: 'User answers multiple statements with yes or no.',
      available: false // Or true if implemented
    }
  ];
  
  // ... (rest of the component remains the same)
  // Ensure the "See Interactive Demo" link works for dropdown_selection
  // by navigating to /question-types-demo/dropdown_selection
  
  return (
    <div className="min-h-screen bg-custom-light-bg py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-12 text-custom-dark-blue">
          Available Question Types
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableTypes.map((typeInfo) => (
            <div 
              key={typeInfo.type}
              className={`bg-white p-6 rounded-lg shadow-lg transition-all duration-300 
                ${typeInfo.available 
                  ? 'cursor-pointer hover:shadow-xl transform hover:-translate-y-1' 
                  : 'opacity-60 cursor-not-allowed'
                }`}
              onClick={() => {
                if (typeInfo.available) {
                  // Update selectedType to trigger display of the demo link section
                  setSelectedType(typeInfo.type);
                }
              }}
            >
              <h2 className="text-xl font-bold mb-2 text-custom-primary">{typeInfo.name}</h2>
              <p className="text-gray-600 mb-4">{typeInfo.description}</p>
              <div className={`px-4 py-2 rounded-full text-sm font-medium text-center ${
                typeInfo.available 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
              }`}>
                {typeInfo.available ? 'Available' : 'Coming Soon'}
              </div>
            </div>
          ))}
        </div>
        
        {selectedType && availableTypes.find(t => t.type === selectedType)?.available && (
          <div className="mt-12 bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-custom-dark-blue">
              {availableTypes.find(t => t.type === selectedType)?.name} Example
            </h2>
            
            <div className="mb-8">
              <p className="text-lg font-medium text-center text-custom-primary">
                Click the button below to see an interactive demo of this question type.
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <Link
                href={`/question-types-demo/${selectedType}`}
                className="bg-custom-primary hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg text-center"
              >
                See Interactive Demo
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionTypesPage;
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Tsx
IGNORE_WHEN_COPYING_END

Update app/question-types-demo/[type]/page.tsx to render the new component.

// app/question-types-demo/[type]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AnyQuestion, QuestionType, DropdownSelectionQuestion } from '../../types/quiz'; // Added DropdownSelectionQuestion
import SingleSelectionComponent from '../../features/quiz/components/question-types/SingleSelectionComponent';
import MultiChoiceComponent from '../../features/quiz/components/question-types/MultiChoiceComponent';
import DropdownSelectionComponent from '../../features/quiz/components/question-types/DropdownSelectionComponent'; // New
import { fetchRandomQuestionByTypeAndFilters } from '../../lib/supabaseQuizService';

export default function QuestionTypeDemo({ params }: { params: { type: string } }) {
  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for demo interactions
  const [singleSelectedOption, setSingleSelectedOption] = useState<string | null>(null);
  const [multiSelectedOptions, setMultiSelectedOptions] = useState<string[]>([]);
  const [dropdownSelections, setDropdownSelections] = useState<Record<string, string | null>>({});
  
  const [isSubmittedDemo, setIsSubmittedDemo] = useState(false);
  const [showCorrectAnswerDemo, setShowCorrectAnswerDemo] = useState(false);

  const [filters, setFilters] = useState({
    difficulty: 'all',
    tags: [] as string[]
  });
  const questionType = params.type as QuestionType;
  
  const loadQuestion = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCurrentQuestion(null);
    // Reset interactive states
    setSingleSelectedOption(null);
    setMultiSelectedOptions([]);
    setDropdownSelections({});
    setIsSubmittedDemo(false);
    setShowCorrectAnswerDemo(false);

    try {
      const question = await fetchRandomQuestionByTypeAndFilters(questionType, filters);
      if (question) {
        setCurrentQuestion(question);
        if (question.type === 'dropdown_selection') {
            const initialDdSelections: Record<string, string | null> = {};
            (question as DropdownSelectionQuestion).placeholderTargets.forEach(target => {
                initialDdSelections[target.key] = null;
            });
            setDropdownSelections(initialDdSelections);
        }
      } else {
        setError(`No question found for type "${questionType}" with current filters.`);
      }
    } catch (err: any) {
      console.error("Error fetching question:", err);
      setError(err.message || 'Failed to fetch question.');
    } finally {
      setIsLoading(false);
    }
  }, [questionType, filters]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const handleAnswerSelect = (answer: any) => {
    if (isSubmittedDemo) return;
    if (currentQuestion?.type === 'single_selection') {
      setSingleSelectedOption(answer as string);
    } else if (currentQuestion?.type === 'multi') {
      setMultiSelectedOptions(answer as string[]);
    } else if (currentQuestion?.type === 'dropdown_selection') {
      setDropdownSelections(answer as Record<string, string | null>);
    }
  };
  
  const getSelectedAnswerForRenderer = () => {
    if (currentQuestion?.type === 'single_selection') return singleSelectedOption;
    if (currentQuestion?.type === 'multi') return multiSelectedOptions;
    if (currentQuestion?.type === 'dropdown_selection') return dropdownSelections;
    return undefined;
  }

  // ... (isLoading, error, !currentQuestion rendering logic from existing file)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-custom-light-bg flex items-center justify-center">
        <p className="text-xl text-custom-dark-blue">Loading question...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-custom-light-bg flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-lg text-gray-700 mb-6">{error}</p>
          <button 
            onClick={loadQuestion} 
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/question-types"
            className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Question Types
          </a>
        </div>
      </div>
    );
  }
  
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-custom-light-bg flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">No Question Available</h1>
          <p className="text-lg text-gray-700 mb-6">
            Could not load a question of type "{questionType}" with the current filters (Difficulty: {filters.difficulty}, Tags: {filters.tags.join(', ') || 'None'}).
          </p>
          <button 
            onClick={loadQuestion} 
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2 transition-colors"
          >
            Try Fetching Again
          </button>
          <a
            href="/question-types"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Question Types
          </a>
        </div>
      </div>
    );
  }


  const pageTitle = `${currentQuestion.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Question Demo`;

  return (
    <div className="min-h-screen bg-custom-light-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-custom-dark-blue">
          {pageTitle}
        </h1>
        
        {/* Filter section (copied from existing, can be refactored into a component) */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <h2 className="text-xl font-semibold mb-2 md:mb-0 text-custom-primary">Filters</h2>
            <button 
              onClick={() => setFilters({ difficulty: 'all', tags: [] })}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Reset Filters
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.difficulty}
                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              >
                <option value="all">All difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (e.g., Quiz ID)</label>
              <div className="space-x-4">
                {['azure-a102', 'aws-fundamentals', 'react-basics'].map(tag => ( // Example tags
                  <label key={tag} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600"
                      checked={filters.tags.includes(tag)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                        } else {
                          setFilters(prev => ({ 
                            ...prev, 
                            tags: prev.tags.filter(t => t !== tag) 
                          }));
                        }
                      }}
                    />
                    <span className="ml-2 text-gray-700">{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
           <button 
            onClick={loadQuestion} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Fetch New Question
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-custom-primary">Instructions</h2>
          <p className="text-gray-700">
            {currentQuestion.type === 'single_selection' && 'Select the correct answer from the options below.'}
            {currentQuestion.type === 'multi' && `Select all correct answers. (Correct: ${(currentQuestion as MultiChoiceQuestion).correctAnswerOptionIds.length})`}
            {currentQuestion.type === 'dropdown_selection' && 'Select the correct option for each placeholder in the text.'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Question:</h3>
              <p className="text-lg text-gray-700 mt-2 whitespace-pre-wrap">
                {/* For dropdown, the actual question text with placeholders is in question.question */}
                {/* For other types, question.question is fine. */}
                {/* The DropdownSelectionComponent will handle rendering the question with dropdowns. */}
                {currentQuestion.type !== 'dropdown_selection' ? currentQuestion.question : ''}
              </p>
            </div>
          
          {currentQuestion.type === 'single_selection' && (
            <SingleSelectionComponent
              question={currentQuestion as SingleSelectionQuestion}
              selectedOptionId={singleSelectedOption}
              onAnswerSelect={handleAnswerSelect}
              isSubmitted={isSubmittedDemo}
              showCorrectAnswer={showCorrectAnswerDemo}
            />
          )}
          {currentQuestion.type === 'multi' && (
            <MultiChoiceComponent
              question={currentQuestion as MultiChoiceQuestion}
              selectedOptionIds={multiSelectedOptions}
              onAnswerSelect={handleAnswerSelect}
              isSubmitted={isSubmittedDemo}
              showCorrectAnswer={showCorrectAnswerDemo}
            />
          )}
          {currentQuestion.type === 'dropdown_selection' && (
            <DropdownSelectionComponent
              question={currentQuestion as DropdownSelectionQuestion}
              selectedAnswer={dropdownSelections}
              onAnswerSelect={handleAnswerSelect}
              isSubmitted={isSubmittedDemo}
              showCorrectAnswer={showCorrectAnswerDemo}
            />
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-3 text-custom-dark-blue">Demo Controls</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={() => setIsSubmittedDemo(!isSubmittedDemo)}
                className={`px-4 py-2 rounded-md text-white font-medium transition-colors text-sm ${
                  isSubmittedDemo ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isSubmittedDemo ? 'View Mode (Answers Locked)' : 'Submit Mode (Lock Answers)'}
              </button>
              <button
                onClick={() => setShowCorrectAnswerDemo(!showCorrectAnswerDemo)}
                className={`px-4 py-2 rounded-md text-white font-medium transition-colors text-sm ${
                  showCorrectAnswerDemo ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                }`}
                disabled={!isSubmittedDemo} // Only allow showing feedback if submitted
              >
                {showCorrectAnswerDemo ? 'Hide Feedback' : 'Show Feedback'}
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-600">
              {isSubmittedDemo 
                ? 'Answers are locked. Toggle "Show Feedback" to see correctness.' 
                : 'Select answers, then "Lock Answers" to simulate submission and enable feedback.'}
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a
            href="/question-types"
            className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Question Types
          </a>
        </div>
      </div>
    </div>
  );
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Tsx
IGNORE_WHEN_COPYING_END

A small correction in DropdownSelectionComponent: the initial value for the select should be currentSelectedText || "" to correctly show "Select..." if null. And added disabled to the default option if no selection or selection is empty string.

Final check: The migration script uses q.target to populate dropdown_selection_targets. q.target in the sample JSON is {"option_set1": "AudioStreamFormat.GetCompressedFormat", ...}. This maps key to value (correct option text). This is consistent.

One more adjustment: QuestionContent component is used in QuestionCard. For dropdown_selection, question.question itself contains the placeholders. DropdownSelectionComponent will parse and render this. So, QuestionContent should perhaps not render the main question text if the type is dropdown_selection, or it renders it as is, and DropdownSelectionComponent handles the interactive part.
The current QuestionContent just displays question.question. This is fine, as DropdownSelectionComponent will also receive question.question and render it with dropdowns.
To avoid duplicate rendering of the raw text by QuestionContent when DropdownSelectionComponent is also rendering it, we might adjust QuestionCard or QuestionContent.
A simple solution is for QuestionContent to display question.question only if the type is not dropdown_selection, or if dropdown_selection questions have a separate brief instruction in question.question and the placeholder text in a different field (which is not the current setup).
Given the current structure where BaseQuestion.question holds the interactive text for dropdown_selection, QuestionContent will display this raw text, and then DropdownSelectionComponent will display the parsed, interactive version. This might be slightly redundant visually.

Let's assume for now that QuestionContent displaying the raw text with [placeholder] is acceptable before DropdownSelectionComponent renders the interactive version below it. The sample JSON had question (instruction) and questionText (interactive). If questions.question in DB maps to questionText, then the QuestionCard should be aware of this.
QuestionContent gets question.question. QuestionTypeRenderer gets the full question object.
If DropdownSelectionQuestion has an additional instructionalText field, QuestionContent could display that, and DropdownSelectionComponent uses question.question (the one with placeholders).
For now, I'll stick to BaseQuestion.question being the source for DropdownSelectionComponent. The visual of QuestionContent displaying the raw text first is a minor UI detail that can be refined later if problematic.

Consider how the sample JSON's question (instruction) and questionText (interactive text with placeholders) map to the questions table. The migration script only uses q.question.
If q.question in the JSON refers to the general instruction, and q.questionText (from your example clean_dropdown_sample.json) is the one with placeholders, then the migration script needs to be updated to store q.questionText into the questions.question column in the database.
And the DropdownSelectionQuestion type in app/types/quiz.ts would then implicitly use BaseQuestion.question as the text with placeholders. The general instruction part would either be prepended or need a new field in BaseQuestion or DropdownSelectionQuestion.

Assuming the migrate-quiz-data.js is updated to put the text with placeholders into questions.question column.
The provided clean_dropdown_sample.json uses questionText for the interactive part. The current migration script maps json.question to db.question.
This needs to be reconciled in the actual data migration. For this exercise, I will assume db.questions.question contains the text with placeholders like [key].

// From app/data/quizzes/azure-a102/clean_dropdown_sample.json:
// "question": "Complete the Speech SDK code snippet for streaming MP3 data.",
// "questionText": "You are developing... var audioFormat = [option_set1](AudioStreamContainerFormat.MP3); ... new [option_set2](speechConfig, audioConfig)...",
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Json
IGNORE_WHEN_COPYING_END

The migrate-quiz-data.js will need this logic:

// Inside the loop in migrate-quiz-data.js, when creating baseRows:
const questionTextForDB = q.questionText || q.question; // Prioritize questionText if available
// ...
// question: questionTextForDB,
// ...
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
JavaScript
IGNORE_WHEN_COPYING_END

This change is outside the scope of just adding the dropdown component files but is crucial for data integrity. I will proceed assuming the questions.question column in the database correctly stores the text intended for placeholder replacement. The components are built based on this assumption.

Final check of component props:

DropdownSelectionComponent receives question.question which has placeholders.

onAnswerSelect is called with {placeholderKey: "selectedOptionText"}.

selectedAnswer from parent is {placeholderKey: "selectedOptionText"}.

showCorrectAnswer is used for styling.

The correctOptionText in DropdownPlaceholderTarget is the text of the correct option.
The options in DropdownSelectionQuestion provide option_id and text.
When user selects an option, the component gets the selected option's text to store in currentSelections and pass to onAnswerSelect. This matches the correctOptionText for validation. This seems correct.

One final thought on DropdownSelectionComponent: placeholder regex. \[([^\]]+)\] is good. It captures the content inside [].

The logic for resetting filters on the demo page: setFilters({ difficulty: 'all', tags: [] }) and then calling loadQuestion() (which is now in useEffect and will be triggered by filter change) is correct. The Fetch New Question button is also good for explicit re-fetch with same filters.Okay, I've created and updated the necessary files to implement the dropdown_selection question type.

Here’s a summary of the changes:

app/types/quiz.ts:

Added DropdownOption, DropdownPlaceholderTarget, and DropdownSelectionQuestion interfaces.

Updated AnyQuestion to include DropdownSelectionQuestion.

app/lib/supabaseQuizService.ts:

Modified enrichQuestionWithDetails to handle the dropdown_selection type:

Fetches options from dropdown_selection_options.

Fetches placeholder targets (key and correct option text) from dropdown_selection_targets.

Constructs and returns a DropdownSelectionQuestion object.

app/features/quiz/components/question-types/DropdownSelectionComponent.tsx:

Created a new component to render dropdown selection questions.

Parses the question text (from question.question) to find placeholders like [key].

Renders text segments interspersed with <select> dropdowns for each placeholder.

Populates each dropdown with all available options from question.options.

Manages user selections for each dropdown, storing the selected text values.

Calls onAnswerSelect with an object mapping placeholder keys to selected option texts (e.g., {"placeholder_key": "selected_option_text"}).

Applies visual feedback (border colors on dropdowns) based on isSubmitted and showCorrectAnswer props by comparing selected text with question.placeholderTargets[key].correctOptionText.

app/features/quiz/components/question-types/QuestionTypeRenderer.tsx:

Added a case for 'dropdown_selection' to import and render the DropdownSelectionComponent.

app/features/quiz/hooks/useQuizState.ts:

Updated the QuizAction type for SUBMIT_ANSWER to potentially include placeholderTargets for client-side validation hints (though primary validation for complex types like dropdown might still rely on server/edge function).

In the quizReducer's SUBMIT_ANSWER case, added logic for dropdown_selection:

It expects the answer payload to be an object mapping placeholder keys to selected option texts.

It compares these selections against currentQuestionForSubmit.placeholderTargets to determine isClientCorrect.

app/features/quiz/pages/QuizPage.tsx:

Added a filter link for "Dropdown" question types.

The availableQuestionTypes export was also updated, though the component itself uses hardcoded links for filters.

app/question-types/page.tsx:

Marked "Dropdown Selection" as available: true.

Ensured the "See Interactive Demo" link works for this type.

app/question-types-demo/[type]/page.tsx:

Updated to correctly handle and render dropdown_selection questions using the new DropdownSelectionComponent.

Manages local state for dropdownSelections and passes it to the component.

The "Instructions" section is updated for dropdowns.

Important Considerations Based on Provided Files & Logic:

Data Migration (migrate-quiz-data.js):

The current migrate-quiz-data.js maps q.question from the source JSON to the questions.question column in the database.

However, your sample clean_dropdown_sample.json has two relevant fields: question (an instructional sentence) and questionText (the text with placeholders like [option_set1]).

For the DropdownSelectionComponent to work as intended (parsing placeholders from props.question.question), the migrate-quiz-data.js script must be updated to store the content of q.questionText (if it exists for dropdowns) into the questions.question database column.

A simple change in the migration script would be:

// Inside the loop in migrate-quiz-data.js, when creating baseRows:
const questionTextForDB = q.questionText || q.question; 
// ...
// const baseRows = allQuestions.map(q => ({
//   // ...
//   question: q.questionText || q.question, // Use questionText if available
//   // ...
// }));
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
JavaScript
IGNORE_WHEN_COPYING_END

Without this change in data migration, the DropdownSelectionComponent won't find any placeholders if it receives only the instructional question string. My implementation assumes the questions.question field in the DB will contain the text with placeholders.

Styling of DropdownSelectionComponent:

Basic styling has been added for the dropdowns, including feedback borders. This can be further customized via CSS.

The component renders the question text with inline <select> elements. Care has been taken to handle multiline text from question.question by splitting by \n and rendering <br /> tags.

The SQL schema (supabase_database.sql) for dropdown_selection_options and dropdown_selection_targets aligns with the data processing in migrate-quiz-data.js and the fetching logic in supabaseQuizService.ts.

You should now have a functional dropdown_selection question type. Remember to test thoroughly, especially the data flow from migration to rendering and scoring.
/**
 * Type definitions for different question types in the quiz
 * Each question type has its own specific properties and answer format
 */

import { BaseQuestion } from './';

// ========================
// 1. Single Selection (Multiple Choice)
// ========================
export interface SingleSelectionQuestion extends BaseQuestion {
  type: 'single_selection';
  options: string[];
  correctAnswer: string; // ID of the correct option
  shuffleOptions?: boolean;
  showOtherOption?: boolean;
  otherOptionLabel?: string;
}

// ========================
// 2. Multiple Selection
// ========================
export interface MultiSelectionQuestion extends BaseQuestion {
  type: 'multi_selection';
  options: string[];
  correctAnswer: string[]; // IDs of all correct options
  minSelections?: number;
  maxSelections?: number;
  shuffleOptions?: boolean;
  showOtherOption?: boolean;
  otherOptionLabel?: string;
}

// ========================
// 3. True/False
// ========================
export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
  correctAnswer: boolean;
  trueLabel?: string;
  falseLabel?: string;
}

// ========================
// 4. Short Answer
// ========================
export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer';
  correctAnswer: string | string[]; // Can be exact match or array of acceptable answers
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
  // For textarea vs single-line input
  multiline?: boolean;
  rows?: number;
  // For regex validation
  pattern?: string;
  patternError?: string;
}

// ========================
// 5. Dropdown Selection
// ========================
export interface DropdownSelectionQuestion extends BaseQuestion {
  type: 'dropdown_selection';
  options: string[];
  correctAnswer: string; // ID of the correct option
  placeholder?: string;
  searchable?: boolean;
  allowClear?: boolean;
}

// ========================
// 6. Ordering Question
// ========================
export interface OrderQuestion extends BaseQuestion {
  type: 'order';
  items: string[];
  correctAnswer: string[]; // Correct order of item IDs
  itemLabels?: Record<string, string>; // Optional labels for items
  shuffleItems?: boolean;
}

// ========================
// 7. Yes/No Question
// ========================
export interface YesNoQuestion extends BaseQuestion {
  type: 'yes_no';
  correctAnswer: boolean;
  yesLabel?: string;
  noLabel?: string;
  showNeutralOption?: boolean;
  neutralLabel?: string;
}

// ========================
// 8. Multiple Yes/No Questions
// ========================
export interface YesNoMultiQuestion extends BaseQuestion {
  type: 'yesno_multi';
  items: Array<{
    id: string;
    text: string;
    correctAnswer: boolean;
  }>;
  correctAnswer: boolean[]; // Array of correct answers in the same order as items
  showNeutralOption?: boolean;
  neutralLabel?: string;
}

// ========================
// 9. Drag and Drop
// ========================
export interface DragAndDropQuestion extends BaseQuestion {
  type: 'drag_and_drop';
  /**
   * Items that can be dragged
   * id: Unique identifier
   * content: Display content (can be text, image URL, or React node)
   * groupId: Optional group identifier for items that can only be dropped in specific targets
   */
  draggableItems: Array<{
    id: string;
    content: string | React.ReactNode;
    groupId?: string;
  }>;
  
  /**
   * Drop zones where items can be dropped
   * id: Unique identifier
   * label: Display label for the drop zone
   * accepts: Array of groupIds that this drop zone accepts (empty = accepts all)
   * maxItems: Maximum number of items that can be dropped here
   */
  dropZones: Array<{
    id: string;
    label: string;
    accepts?: string[];
    maxItems?: number;
  }>;
  
  /**
   * Correct answer mapping
   * Maps drop zone IDs to arrays of item IDs that should be in that zone
   */
  correctAnswer: Record<string, string[]>;
  
  // UI configuration
  allowDuplicates?: boolean;
  showFeedbackOnDrop?: boolean;
  resetButtonText?: string;
  submitButtonText?: string;
}

// ========================
// 10. Matching Question
// ========================
export interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  /**
   * Premises (left side items to be matched)
   */
  premises: Array<{
    id: string;
    content: string | React.ReactNode;
  }>;
  
  /**
   * Responses (right side items to match to)
   */
  responses: Array<{
    id: string;
    content: string | React.ReactNode;
  }>;
  
  /**
   * Correct matches between premises and responses
   * Maps premise ID to response ID
   */
  correctAnswer: Record<string, string>;
  
  // UI configuration
  shufflePremises?: boolean;
  shuffleResponses?: boolean;
  allowPartialCredit?: boolean;
  showFeedbackOnMatch?: boolean;
}

// Union type for all question types
export type QuizQuestion = 
  | SingleSelectionQuestion
  | MultiSelectionQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion
  | DropdownSelectionQuestion
  | OrderQuestion
  | YesNoQuestion
  | YesNoMultiQuestion
  | DragAndDropQuestion
  | MatchingQuestion;

// Type guard functions
export const isSingleSelectionQuestion = (
  question: QuizQuestion
): question is SingleSelectionQuestion => question.type === 'single_selection';

export const isMultiSelectionQuestion = (
  question: QuizQuestion
): question is MultiSelectionQuestion => question.type === 'multi_selection';

export const isTrueFalseQuestion = (
  question: QuizQuestion
): question is TrueFalseQuestion => question.type === 'true_false';

export const isShortAnswerQuestion = (
  question: QuizQuestion
): question is ShortAnswerQuestion => question.type === 'short_answer';

export const isDropdownSelectionQuestion = (
  question: QuizQuestion
): question is DropdownSelectionQuestion => question.type === 'dropdown_selection';

export const isOrderQuestion = (
  question: QuizQuestion
): question is OrderQuestion => question.type === 'order';

export const isYesNoQuestion = (
  question: QuizQuestion
): question is YesNoQuestion => question.type === 'yes_no';

export const isYesNoMultiQuestion = (
  question: QuizQuestion
): question is YesNoMultiQuestion => question.type === 'yesno_multi';

export const isDragAndDropQuestion = (
  question: QuizQuestion
): question is DragAndDropQuestion => question.type === 'drag_and_drop';

export const isMatchingQuestion = (
  question: QuizQuestion
): question is MatchingQuestion => question.type === 'matching';

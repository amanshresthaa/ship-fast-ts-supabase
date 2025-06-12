/**
 * Type definitions for quiz answers and validation
 * Defines the structure for user responses and answer validation
 */

import { QuizQuestion } from './question-types';

// ========================
// 1. Base Answer Types
// ========================

/** Base interface for all user answers */
export interface BaseUserAnswer {
  /** Unique identifier for the question being answered */
  questionId: string;
  
  /** The user's answer (format depends on question type) */
  answer: any;
  
  /** Whether the answer is correct (if validated) */
  isCorrect?: boolean;
  
  /** When the answer was submitted (ISO timestamp) */
  timestamp: string;
  
  /** Time spent on the question in seconds */
  timeSpent: number;
  
  /** Points earned for this answer */
  pointsEarned?: number;
  
  /** Maximum possible points for this question */
  maxPoints?: number;
  
  /** Whether the question was flagged for review */
  isFlagged?: boolean;
  
  /** Optional feedback for the answer */
  feedback?: string;
  
  /** Server-provided validation (if any) */
  validation?: AnswerValidation;
  
  /** Any additional metadata */
  metadata?: Record<string, any>;
}

// ========================
// 2. Question-Specific Answer Types
// ========================

/** Answer for single selection questions */
export interface SingleSelectionAnswer extends BaseUserAnswer {
  answer: string; // ID of selected option
}

/** Answer for multiple selection questions */
export interface MultiSelectionAnswer extends BaseUserAnswer {
  answer: string[]; // IDs of selected options
}

/** Answer for true/false questions */
export interface TrueFalseAnswer extends BaseUserAnswer {
  answer: boolean;
}

/** Answer for short answer questions */
export interface ShortAnswerAnswer extends BaseUserAnswer {
  answer: string;
  normalizedAnswer?: string; // For case-insensitive comparison
}

/** Answer for dropdown selection questions */
export interface DropdownSelectionAnswer extends BaseUserAnswer {
  answer: string; // ID of selected option
}

/** Answer for ordering questions */
export interface OrderAnswer extends BaseUserAnswer {
  answer: string[]; // Ordered list of item IDs
  correctOrder?: string[]; // For reference
  isPartiallyCorrect?: boolean;
  partialCredit?: number; // 0-1 scale
}

/** Answer for yes/no questions */
export interface YesNoAnswer extends BaseUserAnswer {
  answer: boolean;
}

/** Answer for multiple yes/no questions */
export interface YesNoMultiAnswer extends BaseUserAnswer {
  answer: boolean[]; // Array of answers in the same order as items
  correctAnswers?: boolean[]; // For reference
  correctCount?: number;
  totalCount?: number;
}

/** Answer for drag and drop questions */
export interface DragAndDropAnswer extends BaseUserAnswer {
  answer: Record<string, string[]>; // Maps drop zone IDs to array of item IDs
  correctAnswer?: Record<string, string[]>; // For reference
  isPartiallyCorrect?: boolean;
  partialCredit?: number; // 0-1 scale
}

/** Answer for matching questions */
export interface MatchingAnswer extends BaseUserAnswer {
  answer: Record<string, string>; // Maps premise IDs to response IDs
  correctAnswer?: Record<string, string>; // For reference
  isPartiallyCorrect?: boolean;
  partialCredit?: number; // 0-1 scale
}

// Union type for all answer types
export type UserAnswer = 
  | SingleSelectionAnswer
  | MultiSelectionAnswer
  | TrueFalseAnswer
  | ShortAnswerAnswer
  | DropdownSelectionAnswer
  | OrderAnswer
  | YesNoAnswer
  | YesNoMultiAnswer
  | DragAndDropAnswer
  | MatchingAnswer;

// ========================
// 3. Answer Validation
// ========================

export interface AnswerValidation {
  /** Whether the answer is valid (regardless of correctness) */
  isValid: boolean;
  
  /** Error message if answer is invalid */
  error?: string;
  
  /** Warning message (e.g., for partial credit) */
  warning?: string;
  
  /** Detailed feedback on the answer */
  feedback?: string;
  
  /** Correct answer (if showing answers) */
  correctAnswer?: any;
  
  /** Explanation of the correct answer */
  explanation?: string;
  
  /** Points awarded for this answer */
  pointsAwarded?: number;
  
  /** Maximum possible points for this question */
  maxPoints?: number;
}

// ========================
// 4. Answer Utility Types
// ========================

/** Type for answer validation functions */
export type AnswerValidator<T extends QuizQuestion> = (
  question: T,
  answer: any
) => AnswerValidation;

/** Type for answer comparison functions */
export type AnswerComparator<T extends QuizQuestion> = (
  userAnswer: any,
  correctAnswer: any
) => boolean;

// ========================
// 5. Type Guards
// ========================

export const isSingleSelectionAnswer = (
  answer: UserAnswer
): answer is SingleSelectionAnswer => 
  Array.isArray((answer as any).answer) === false && 
  typeof (answer as any).answer === 'string';

export const isMultiSelectionAnswer = (
  answer: UserAnswer
): answer is MultiSelectionAnswer => 
  Array.isArray((answer as any).answer);

export const isTrueFalseAnswer = (
  answer: UserAnswer
): answer is TrueFalseAnswer =>
  typeof (answer as any).answer === 'boolean';

export const isShortAnswerAnswer = (
  answer: UserAnswer
): answer is ShortAnswerAnswer =>
  typeof (answer as any).answer === 'string';

export const isOrderAnswer = (
  answer: UserAnswer
): answer is OrderAnswer =>
  Array.isArray((answer as any).answer) && 'isPartiallyCorrect' in answer;

export const isYesNoMultiAnswer = (
  answer: UserAnswer
): answer is YesNoMultiAnswer =>
  Array.isArray((answer as any).answer) && 'correctCount' in answer;

export const isDragAndDropAnswer = (
  answer: UserAnswer
): answer is DragAndDropAnswer =>
  typeof (answer as any).answer === 'object' && 
  !Array.isArray((answer as any).answer) &&
  'isPartiallyCorrect' in answer;

export const isMatchingAnswer = (
  answer: UserAnswer
): answer is MatchingAnswer =>
  typeof (answer as any).answer === 'object' && 
  !Array.isArray((answer as any).answer) &&
  'isPartiallyCorrect' in answer;

// ========================
// 6. Answer Creation Helpers
// ========================

/** Create a new answer object with default values */
export const createAnswer = <T extends QuizQuestion>(
  question: T,
  answer: any,
  timeSpent: number = 0,
  isFlagged: boolean = false
): UserAnswer => {
  const baseAnswer: BaseUserAnswer = {
    questionId: question.id,
    answer,
    timestamp: new Date().toISOString(),
    timeSpent,
    isFlagged,
    pointsEarned: 0,
    maxPoints: question.points || 1,
  };

  // Add type-specific properties
  switch (question.type) {
    case 'single_selection':
    case 'dropdown_selection':
      return { ...baseAnswer } as SingleSelectionAnswer;
      
    case 'multi_selection':
      return { ...baseAnswer } as MultiSelectionAnswer;
      
    case 'true_false':
    case 'yes_no':
      return { ...baseAnswer } as TrueFalseAnswer;
      
    case 'short_answer':
      return { 
        ...baseAnswer,
        normalizedAnswer: question.caseSensitive 
          ? String(answer) 
          : String(answer).toLowerCase()
      } as ShortAnswerAnswer;
      
    case 'order':
      return { 
        ...baseAnswer,
        isPartiallyCorrect: false,
        partialCredit: 0
      } as OrderAnswer;
      
    case 'yesno_multi':
      return { 
        ...baseAnswer,
        correctCount: 0,
        totalCount: question.items.length
      } as YesNoMultiAnswer;
      
    case 'drag_and_drop':
      return { 
        ...baseAnswer,
        isPartiallyCorrect: false,
        partialCredit: 0
      } as DragAndDropAnswer;
      
    case 'matching':
      return { 
        ...baseAnswer,
        isPartiallyCorrect: false,
        partialCredit: 0
      } as MatchingAnswer;
      
    default:
      return baseAnswer as UserAnswer;
  }
};

/** Validate an answer against a question */
export const validateAnswer = (
  question: QuizQuestion,
  answer: any
): AnswerValidation => {
  // Base validation that applies to all question types
  if (answer === null || answer === undefined) {
    return {
      isValid: false,
      error: 'Answer is required',
      pointsAwarded: 0,
      maxPoints: question.points || 1
    };
  }

  // Type-specific validation
  switch (question.type) {
    case 'single_selection':
    case 'dropdown_selection':
      return validateSingleSelection(question, answer);
      
    case 'multi_selection':
      return validateMultiSelection(question, answer);
      
    case 'true_false':
    case 'yes_no':
      return validateTrueFalse(question, answer);
      
    case 'short_answer':
      return validateShortAnswer(question, answer);
      
    case 'order':
      return validateOrder(question, answer);
      
    case 'yesno_multi':
      return validateYesNoMulti(question, answer);
      
    case 'drag_and_drop':
      return validateDragAndDrop(question, answer);
      
    case 'matching':
      return validateMatching(question, answer);
      
    default:
      return {
        isValid: false,
        error: 'Unsupported question type',
        pointsAwarded: 0,
        maxPoints: question.points || 1
      };
  }
};

// Type-specific validation functions (simplified for brevity)
const validateSingleSelection = (
  question: any,
  answer: any
): AnswerValidation => {
  // Implementation for single selection validation
  return {
    isValid: true,
    pointsAwarded: answer === question.correctAnswer ? question.points || 1 : 0,
    maxPoints: question.points || 1,
    isCorrect: answer === question.correctAnswer,
    correctAnswer: question.correctAnswer
  };
};

const validateMultiSelection = (
  question: any,
  answer: any
): AnswerValidation => {
  // Implementation for multi-selection validation
  return {
    isValid: true,
    pointsAwarded: 0, // Calculate based on correct/incorrect selections
    maxPoints: question.points || 1,
    isCorrect: false, // Determine if all correct and no incorrect
    correctAnswer: question.correctAnswer
  };
};

// Other validation functions would be implemented similarly
const validateTrueFalse = () => ({} as AnswerValidation);
const validateShortAnswer = () => ({} as AnswerValidation);
const validateOrder = () => ({} as AnswerValidation);
const validateYesNoMulti = () => ({} as AnswerValidation);
const validateDragAndDrop = () => ({} as AnswerValidation);
const validateMatching = () => ({} as AnswerValidation);

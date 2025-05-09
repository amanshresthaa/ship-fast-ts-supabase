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
  question: string;
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
  // Note: The database table `single_selection_options` does not have `question_id` directly in its TS type,
  // as options will be nested under a question. The `question_id` is for the DB relation.
}

// Updated SingleSelectionQuestion to include specific properties
export interface SingleSelectionQuestion extends BaseQuestion {
  type: 'single_selection';
  options: SelectionOption[];
  // The `single_selection_correct_answer` table stores `option_id` for the correct answer,
  // linked to the `question_id`.
  correctAnswerOptionId: string; 
}

// Multi-choice question where users can select multiple answers
export interface MultiChoiceQuestion extends BaseQuestion {
  type: 'multi';
  options: SelectionOption[];
  // An array of correct option IDs
  correctAnswerOptionIds: string[];
}

// AnyQuestion will be a union of all specific question types
export type AnyQuestion = SingleSelectionQuestion | MultiChoiceQuestion; // | DragAndDropQuestion etc.

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
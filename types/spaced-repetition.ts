// Spaced Repetition & Active Recall Types

export interface QuestionResponse {
  id: string;
  user_id: string;
  question_id: string;
  quiz_session_id?: string;
  user_answer_data: any;
  is_correct: boolean;
  response_time_ms: number;
  confidence_level?: number;
  submitted_at: string;
  updated_at: string;
}

export interface UserQuestionPerformance {
  id: string;
  user_id: string;
  question_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  correct_streak: number;
  incorrect_streak: number;
  total_attempts: number;
  correct_attempts: number;
  avg_response_time_ms?: number;
  priority_score: number;
  last_reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdaptiveQuizSession {
  session_id: string;
  user_id: string;
  quiz_topic: string;
  question_ids: string[];
  session_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ReviewQuestion {
  question_id: string;
  question_text: string;
  question_type: 'drag_and_drop' | 'dropdown_selection' | 'multi' | 'single_selection' | 'order' | 'yes_no' | 'yesno_multi';
  quiz_topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  next_review_date: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  correct_streak: number;
  incorrect_streak: number;
  priority_score: number;
  total_attempts: number;
  correct_attempts: number;
  last_reviewed_at?: string;
}

export interface SM2Parameters {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
}

export interface CreateQuestionResponseRequest {
  question_id: string;
  quiz_session_id?: string;
  user_answer_data: any;
  is_correct: boolean;
  response_time_ms: number;
  confidence_level?: number;
}

export interface CreateQuestionResponseResponse {
  success: boolean;
  response_id: string;
  submitted_at: string;
  performance: UserQuestionPerformance | null;
  message: string;
}

export interface GetReviewQuestionsRequest {
  quiz_topic?: string;
  limit?: number;
}

export interface GetReviewQuestionsResponse {
  success: boolean;
  questions: ReviewQuestion[];
  metadata: {
    total_count: number;
    quiz_topic_filter: string | null;
    limit: number;
    generated_at: string;
  };
}

export interface CreateAdaptiveSessionRequest {
  quiz_topic: string;
  question_ids: string[];
  session_settings?: Record<string, any>;
}

export interface CreateAdaptiveSessionResponse {
  success: boolean;
  session: {
    session_id: string;
    quiz_topic: string;
    question_count: number;
    created_at: string;
    session_settings: Record<string, any>;
  };
  message: string;
}

export interface GetAdaptiveSessionsRequest {
  session_id?: string;
  quiz_topic?: string;
  completed?: boolean;
  limit?: number;
  offset?: number;
}

export interface GetAdaptiveSessionsResponse {
  success: boolean;
  sessions?: AdaptiveQuizSession[];
  session?: AdaptiveQuizSession;
  metadata?: {
    total_count: number;
    quiz_topic_filter: string | null;
    completed_filter?: boolean;
    limit: number;
    offset: number;
  };
}

export interface CompleteAdaptiveSessionRequest {
  session_id: string;
  action: 'complete';
}

export interface CompleteAdaptiveSessionResponse {
  success: boolean;
  message: string;
}

// Quality rating for SM-2 algorithm (0-5 scale)
export type QualityRating = 0 | 1 | 2 | 3 | 4 | 5;

// Confidence level for user responses (1-5 scale)
export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5;

// Spaced repetition statistics
export interface SpacedRepetitionStats {
  total_questions_reviewed: number;
  questions_due_today: number;
  questions_due_this_week: number;
  average_ease_factor: number;
  current_streak: number;
  longest_streak: number;
  accuracy_rate: number;
  average_response_time: number;
  mastered_questions: number; // High ease factor and long intervals
  struggling_questions: number; // High incorrect streaks or low ease factors
}

// Adaptive quiz generation settings
export interface AdaptiveQuizSettings {
  max_questions: number;
  include_new_questions: boolean;
  include_review_questions: boolean;
  new_to_review_ratio?: number; // e.g., 0.3 = 30% new, 70% review
  difficulty_preference?: 'adaptive' | 'easy' | 'medium' | 'hard';
  prioritize_struggling?: boolean;
  time_limit_minutes?: number;
}

// Database function result types
export interface SM2CalculationResult {
  new_ease_factor: number;
  new_interval_days: number;
  new_repetitions: number;
  next_review_date: string;
}

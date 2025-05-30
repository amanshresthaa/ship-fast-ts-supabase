-- User Progress Tracking Tables
-- This file contains tables for tracking user progress through quizzes

-- ------------------------------------------------------------------
-- USER QUIZ PROGRESS
-- ------------------------------------------------------------------
-- Create user_quiz_progress table to store the user's progress in a quiz
CREATE TABLE IF NOT EXISTS public.user_quiz_progress (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id               TEXT        NOT NULL,
  question_type_filter  TEXT,
  current_question_index INTEGER    NOT NULL DEFAULT 0,
  user_answers          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  is_explicitly_completed BOOLEAN   NOT NULL DEFAULT false,
  last_saved_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_quiz_progress_quiz
    FOREIGN KEY (quiz_id)
    REFERENCES public.quizzes(id)
    ON DELETE CASCADE,
  CONSTRAINT uq_user_quiz_progress_unique
    UNIQUE(user_id, quiz_id, question_type_filter)
);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_user_quiz_progress_user_id ON public.user_quiz_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_progress_user_quiz ON public.user_quiz_progress (user_id, quiz_id, question_type_filter);
CREATE INDEX IF NOT EXISTS idx_user_quiz_progress_last_saved ON public.user_quiz_progress (last_saved_at);

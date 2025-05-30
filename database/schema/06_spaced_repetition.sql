-- Spaced Repetition System Tables
-- This file contains all tables for the spaced repetition and active recall system

-- ------------------------------------------------------------------
-- QUESTION RESPONSES - DETAILED LOGGING
-- ------------------------------------------------------------------
-- Table to store detailed user responses to questions
CREATE TABLE IF NOT EXISTS public.question_responses (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id           UUID        NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  quiz_session_id       UUID,       -- Optional FK, can be null for standalone questions
  user_answer_data      JSONB       NOT NULL,
  is_correct            BOOLEAN     NOT NULL,
  response_time_ms      INTEGER     NOT NULL CHECK (response_time_ms >= 0),
  confidence_level      INTEGER     CHECK (confidence_level >= 1 AND confidence_level <= 5),
  submitted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_question_responses_user_id ON public.question_responses (user_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_question_id ON public.question_responses (question_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_user_question ON public.question_responses (user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_submitted_at ON public.question_responses (submitted_at);
CREATE INDEX IF NOT EXISTS idx_question_responses_user_submitted ON public.question_responses (user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_responses_question_correct ON public.question_responses (question_id, is_correct, submitted_at);

-- ------------------------------------------------------------------
-- USER QUESTION PERFORMANCE - SM-2 ALGORITHM DATA
-- ------------------------------------------------------------------
-- Table to track individual user performance on each question over time for spaced repetition
CREATE TABLE IF NOT EXISTS public.user_question_performance (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id           UUID        NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  ease_factor           DECIMAL     NOT NULL DEFAULT 2.5 CHECK (ease_factor >= 1.3),
  interval_days         INTEGER     NOT NULL DEFAULT 1 CHECK (interval_days >= 1),
  repetitions           INTEGER     NOT NULL DEFAULT 0 CHECK (repetitions >= 0),
  next_review_date      TIMESTAMPTZ NOT NULL DEFAULT now(),
  correct_streak        INTEGER     NOT NULL DEFAULT 0 CHECK (correct_streak >= 0),
  incorrect_streak      INTEGER     NOT NULL DEFAULT 0 CHECK (incorrect_streak >= 0),
  total_attempts        INTEGER     NOT NULL DEFAULT 0 CHECK (total_attempts >= 0),
  correct_attempts      INTEGER     NOT NULL DEFAULT 0 CHECK (correct_attempts >= 0),
  avg_response_time_ms  INTEGER     CHECK (avg_response_time_ms >= 0),
  priority_score        DECIMAL     NOT NULL DEFAULT 0.0,
  last_reviewed_at      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_question_performance_unique
    UNIQUE(user_id, question_id),
  CONSTRAINT chk_correct_attempts_total
    CHECK (correct_attempts <= total_attempts)
);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_user_question_performance_user_id ON public.user_question_performance (user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_performance_next_review ON public.user_question_performance (next_review_date);
CREATE INDEX IF NOT EXISTS idx_user_question_performance_priority ON public.user_question_performance (priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_question_performance_user_review ON public.user_question_performance (user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_user_question_performance_user_priority ON public.user_question_performance (user_id, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_question_performance_topic_review ON public.user_question_performance 
  USING btree (user_id) INCLUDE (next_review_date, priority_score);
CREATE INDEX IF NOT EXISTS idx_user_question_performance_due_review ON public.user_question_performance (user_id, next_review_date, priority_score DESC);

-- ------------------------------------------------------------------
-- ADAPTIVE QUIZ SESSIONS
-- ------------------------------------------------------------------
-- Table to log adaptive quiz sessions
CREATE TABLE IF NOT EXISTS public.adaptive_quiz_sessions (
  session_id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_topic            TEXT        NOT NULL,
  question_ids          UUID[]      NOT NULL DEFAULT '{}',
  session_settings      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at          TIMESTAMPTZ
);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_adaptive_quiz_sessions_user_id ON public.adaptive_quiz_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_quiz_sessions_topic ON public.adaptive_quiz_sessions (quiz_topic);
CREATE INDEX IF NOT EXISTS idx_adaptive_quiz_sessions_created_at ON public.adaptive_quiz_sessions (created_at);
CREATE INDEX IF NOT EXISTS idx_adaptive_quiz_sessions_user_topic ON public.adaptive_quiz_sessions (user_id, quiz_topic);
CREATE INDEX IF NOT EXISTS idx_adaptive_sessions_user_topic_created ON public.adaptive_quiz_sessions (user_id, quiz_topic, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_adaptive_sessions_completed ON public.adaptive_quiz_sessions (user_id, completed_at) WHERE completed_at IS NOT NULL;

-- Migration: Ensure Spaced Repetition System Database Schema
-- Date: 2025-05-30
-- Description: Create or update all tables needed for the spaced repetition system

BEGIN;

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function for timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure question_responses table exists for spaced repetition
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

-- Ensure user_question_performance table exists for spaced repetition
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

-- Ensure adaptive_quiz_sessions table exists
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

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_question_responses_user_id ON public.question_responses (user_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_question_id ON public.question_responses (question_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_user_question ON public.question_responses (user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_submitted_at ON public.question_responses (submitted_at);

CREATE INDEX IF NOT EXISTS idx_user_question_performance_user_id ON public.user_question_performance (user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_performance_next_review ON public.user_question_performance (next_review_date);
CREATE INDEX IF NOT EXISTS idx_user_question_performance_priority ON public.user_question_performance (priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_question_performance_user_review ON public.user_question_performance (user_id, next_review_date);

CREATE INDEX IF NOT EXISTS idx_adaptive_quiz_sessions_user_id ON public.adaptive_quiz_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_quiz_sessions_topic ON public.adaptive_quiz_sessions (quiz_topic);
CREATE INDEX IF NOT EXISTS idx_adaptive_quiz_sessions_created_at ON public.adaptive_quiz_sessions (created_at);

-- Add triggers for timestamps
DROP TRIGGER IF EXISTS set_timestamp_question_responses ON public.question_responses;
CREATE TRIGGER set_timestamp_question_responses
BEFORE UPDATE ON public.question_responses
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_user_question_performance ON public.user_question_performance;
CREATE TRIGGER set_timestamp_user_question_performance
BEFORE UPDATE ON public.user_question_performance
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_adaptive_quiz_sessions ON public.adaptive_quiz_sessions;
CREATE TRIGGER set_timestamp_adaptive_quiz_sessions
BEFORE UPDATE ON public.adaptive_quiz_sessions
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Enable Row Level Security
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adaptive_quiz_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for question_responses
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own responses" ON public.question_responses;
    DROP POLICY IF EXISTS "Users can insert their own responses" ON public.question_responses;
    DROP POLICY IF EXISTS "Users can update their own responses" ON public.question_responses;
    DROP POLICY IF EXISTS "Users can delete their own responses" ON public.question_responses;
    
    -- Create policies
    CREATE POLICY "Users can view their own responses"
      ON public.question_responses FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own responses"
      ON public.question_responses FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own responses"
      ON public.question_responses FOR UPDATE
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete their own responses"
      ON public.question_responses FOR DELETE
      USING (auth.uid() = user_id);
END
$$;

-- RLS Policies for user_question_performance
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own performance" ON public.user_question_performance;
    DROP POLICY IF EXISTS "Users can insert their own performance" ON public.user_question_performance;
    DROP POLICY IF EXISTS "Users can update their own performance" ON public.user_question_performance;
    DROP POLICY IF EXISTS "Users can delete their own performance" ON public.user_question_performance;
    
    CREATE POLICY "Users can view their own performance"
      ON public.user_question_performance FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own performance"
      ON public.user_question_performance FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own performance"
      ON public.user_question_performance FOR UPDATE
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete their own performance"
      ON public.user_question_performance FOR DELETE
      USING (auth.uid() = user_id);
END
$$;

-- RLS Policies for adaptive_quiz_sessions
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own sessions" ON public.adaptive_quiz_sessions;
    DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.adaptive_quiz_sessions;
    DROP POLICY IF EXISTS "Users can update their own sessions" ON public.adaptive_quiz_sessions;
    DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.adaptive_quiz_sessions;
    
    CREATE POLICY "Users can view their own sessions"
      ON public.adaptive_quiz_sessions FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own sessions"
      ON public.adaptive_quiz_sessions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own sessions"
      ON public.adaptive_quiz_sessions FOR UPDATE
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete their own sessions"
      ON public.adaptive_quiz_sessions FOR DELETE
      USING (auth.uid() = user_id);
END
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_responses TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_question_performance TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adaptive_quiz_sessions TO anon, authenticated, service_role;

COMMIT;

-- Display success message
SELECT 'Spaced repetition database schema migration completed successfully!' as status;

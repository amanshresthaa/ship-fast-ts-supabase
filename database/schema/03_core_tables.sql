-- Core Tables: Quizzes and Questions
-- This file contains the core tables for quiz and question management

-- ------------------------------------------------------------------
-- QUIZ-LEVEL METADATA
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quizzes (
  id           TEXT        PRIMARY KEY,          -- e.g. azure-a102
  title        TEXT        NOT NULL,
  description  TEXT,
  quiz_type    TEXT,
  settings     JSONB,
  author       TEXT,
  difficulty   difficulty  NOT NULL DEFAULT 'medium',
  quiz_topic   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for quizzes table
CREATE INDEX IF NOT EXISTS idx_quizzes_topic      ON public.quizzes (quiz_topic);
CREATE INDEX IF NOT EXISTS idx_quizzes_difficulty ON public.quizzes (difficulty);

-- ------------------------------------------------------------------
-- QUESTIONS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  type               question_type NOT NULL,
  question           TEXT          NOT NULL,
  points             INTEGER       NOT NULL CHECK (points >= 0),
  quiz_tag           TEXT          NOT NULL,
  quiz_topic         TEXT,          -- Added for denormalized access in spaced repetition
  difficulty         difficulty    NOT NULL DEFAULT 'medium',
  explanation        TEXT,
  feedback_correct   TEXT          NOT NULL,
  feedback_incorrect TEXT          NOT NULL,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT fk_questions_quiz
    FOREIGN KEY (quiz_tag)
    REFERENCES public.quizzes(id)
    ON DELETE CASCADE
);

-- Indexes for questions table
CREATE INDEX IF NOT EXISTS idx_questions_type       ON public.questions (type);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_tag   ON public.questions (quiz_tag);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_topic ON public.questions (quiz_topic);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions (difficulty);

-- Additional performance indexes for spaced repetition queries
CREATE INDEX IF NOT EXISTS idx_questions_topic_difficulty ON public.questions (quiz_topic, difficulty);

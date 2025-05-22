-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------------
-- No changes needed unless new types are required
CREATE TYPE question_type AS ENUM (
  'drag_and_drop',
  'dropdown_selection',
  'multi',
  'single_selection',
  'order',
  'yes_no',
  'yesno_multi'
);
CREATE TYPE difficulty AS ENUM ('easy','medium','hard');

-- ------------------------------------------------------------------
-- Utility Function for Timestamps
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
CREATE INDEX IF NOT EXISTS idx_quizzes_topic      ON public.quizzes (quiz_topic);
CREATE INDEX IF NOT EXISTS idx_quizzes_difficulty ON public.quizzes (difficulty);

-- Add trigger for updated_at on quizzes
DROP TRIGGER IF EXISTS set_timestamp_quizzes ON public.quizzes;
CREATE TRIGGER set_timestamp_quizzes
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ------------------------------------------------------------------
-- QUESTIONS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  type               question_type NOT NULL,
  question           TEXT          NOT NULL,
  points             INTEGER       NOT NULL CHECK (points >= 0),
  quiz_tag           TEXT          NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_questions_type       ON public.questions (type);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_tag   ON public.questions (quiz_tag);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions (difficulty);

-- Add trigger for updated_at on questions
DROP TRIGGER IF EXISTS set_timestamp_questions ON public.questions;
CREATE TRIGGER set_timestamp_questions
BEFORE UPDATE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ------------------------------------------------------------------
-- drag_and_drop
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drag_and_drop_targets (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  target_id   TEXT NOT NULL,
  text        TEXT NOT NULL,
  PRIMARY KEY (question_id, target_id)
);

-- *** Refined: Removed target_id and is_correct ***
CREATE TABLE IF NOT EXISTS public.drag_and_drop_options (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id   TEXT NOT NULL,
  text        TEXT NOT NULL,
  PRIMARY KEY (question_id, option_id)
);

CREATE TABLE IF NOT EXISTS public.drag_and_drop_correct_pairs (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id   TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  PRIMARY KEY (question_id, option_id, target_id),
  FOREIGN KEY (question_id, option_id)
    REFERENCES public.drag_and_drop_options(question_id, option_id) ON DELETE CASCADE,
  FOREIGN KEY (question_id, target_id)
    REFERENCES public.drag_and_drop_targets(question_id, target_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- dropdown_selection
-- ------------------------------------------------------------------
-- *** Reverted: Kept is_correct as quizApi.ts relies on it ***
CREATE TABLE IF NOT EXISTS public.dropdown_selection_options (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id   TEXT NOT NULL,
  text        TEXT NOT NULL,
  is_correct  BOOLEAN NOT NULL, -- Kept for quizApi logic
  PRIMARY KEY (question_id, option_id)
);

CREATE TABLE IF NOT EXISTS public.dropdown_selection_targets (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  key         TEXT NOT NULL, -- Placeholder key in the question text e.g., 'city'
  value       TEXT NOT NULL, -- The TEXT value of the correct option for this key
  PRIMARY KEY (question_id, key)
);

-- ------------------------------------------------------------------
-- multi (multi-select) - Structure is good
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.multi_options (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id   TEXT NOT NULL,
  text        TEXT NOT NULL,
  PRIMARY KEY (question_id, option_id)
);

CREATE TABLE IF NOT EXISTS public.multi_correct_answers (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id   TEXT NOT NULL,
  PRIMARY KEY (question_id, option_id),
  FOREIGN KEY (question_id, option_id)
    REFERENCES public.multi_options(question_id, option_id) ON DELETE CASCADE -- Added ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- single_selection - Structure is good
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.single_selection_options (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id   TEXT NOT NULL,
  text        TEXT NOT NULL,
  PRIMARY KEY (question_id, option_id)
);

CREATE TABLE IF NOT EXISTS public.single_selection_correct_answer (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE PRIMARY KEY,
  option_id   TEXT NOT NULL,
  FOREIGN KEY (question_id, option_id)
    REFERENCES public.single_selection_options(question_id, option_id) ON DELETE CASCADE -- Added ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- order
-- ------------------------------------------------------------------
-- *** Refined: Removed position ***
CREATE TABLE IF NOT EXISTS public.order_items (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL,
  text        TEXT NOT NULL,
  PRIMARY KEY (question_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.order_correct_order (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL,
  position    INTEGER NOT NULL CHECK (position > 0),
  PRIMARY KEY (question_id, item_id), -- Ensures each item has only one position
  UNIQUE (question_id, position),      -- Ensures each position is used only once per question
  FOREIGN KEY (question_id, item_id)
    REFERENCES public.order_items(question_id, item_id) ON DELETE CASCADE -- Added ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- yes_no - Structure is good
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yes_no_answer (
  question_id    UUID REFERENCES public.questions(id) ON DELETE CASCADE PRIMARY KEY,
  correct_answer BOOLEAN NOT NULL
);

-- ------------------------------------------------------------------
-- yesno_multi - Structure is good
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yesno_multi_statements (
  question_id  UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  statement_id TEXT NOT NULL,
  text         TEXT NOT NULL,
  PRIMARY KEY (question_id, statement_id)
);

CREATE TABLE IF NOT EXISTS public.yesno_multi_correct_answers (
  question_id    UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  statement_id   TEXT NOT NULL,
  correct_answer BOOLEAN NOT NULL,
  PRIMARY KEY (question_id, statement_id),
  FOREIGN KEY (question_id, statement_id)
    REFERENCES public.yesno_multi_statements(question_id, statement_id) ON DELETE CASCADE -- Added ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- Permissions
-- ------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
  TO anon, authenticated, service_role;

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

-- Add trigger for updated_at on user_quiz_progress
DROP TRIGGER IF EXISTS set_timestamp_user_quiz_progress ON public.user_quiz_progress;
CREATE TRIGGER set_timestamp_user_quiz_progress
BEFORE UPDATE ON public.user_quiz_progress
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Enable Row Level Security
ALTER TABLE public.user_quiz_progress ENABLE ROW LEVEL SECURITY;

-- Define Row Level Security policies
CREATE POLICY "Users can view their own progress"
  ON public.user_quiz_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.user_quiz_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.user_quiz_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON public.user_quiz_progress
  FOR DELETE
  USING (auth.uid() = user_id);
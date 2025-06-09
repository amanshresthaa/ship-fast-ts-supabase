-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------------
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
-- QUIZ-LEVEL METADATA (UPDATED)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quizzes (
  id           TEXT        PRIMARY KEY CHECK (id != ''),          -- e.g. azure-a102
  title        TEXT        NOT NULL CHECK (title != ''),
  description  TEXT,
  quiz_type    TEXT        CHECK (quiz_type IS NULL OR quiz_type != ''),
  quiz_tag     TEXT        DEFAULT 'general' CHECK (quiz_tag != ''),    -- Sub-category/grouping (e.g., 'azure', 'aws')
  settings     JSONB,
  author       TEXT        CHECK (author IS NULL OR author != ''),
  difficulty   difficulty  NOT NULL DEFAULT 'medium',
  quiz_topic   TEXT        CHECK (quiz_topic IS NULL OR quiz_topic != ''),                             -- Main topic (e.g., 'azure-fundamentals')
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for quizzes table
CREATE INDEX IF NOT EXISTS idx_quizzes_topic      ON public.quizzes (quiz_topic);
CREATE INDEX IF NOT EXISTS idx_quizzes_difficulty ON public.quizzes (difficulty);
CREATE INDEX IF NOT EXISTS idx_quizzes_quiz_tag   ON public.quizzes (quiz_tag);
CREATE INDEX IF NOT EXISTS idx_quizzes_quiz_type  ON public.quizzes (quiz_type);

-- Add trigger for updated_at on quizzes
DROP TRIGGER IF EXISTS set_timestamp_quizzes ON public.quizzes;
CREATE TRIGGER set_timestamp_quizzes
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ------------------------------------------------------------------
-- QUESTIONS (FIXED FOREIGN KEY)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  type               question_type NOT NULL,
  question           TEXT          NOT NULL CHECK (question != ''),
  points             INTEGER       NOT NULL CHECK (points >= 0),
  quiz_tag           TEXT          NOT NULL CHECK (quiz_tag != ''),  -- FIXED: Now correctly references quizzes.id
  difficulty         difficulty    NOT NULL DEFAULT 'medium',
  explanation        TEXT          CHECK (explanation IS NULL OR explanation != ''),
  feedback_correct   TEXT          NOT NULL CHECK (feedback_correct != ''),
  feedback_incorrect TEXT          NOT NULL CHECK (feedback_incorrect != ''),
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
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions (difficulty);

-- Add trigger for updated_at on questions
DROP TRIGGER IF EXISTS set_timestamp_questions ON public.questions;
CREATE TRIGGER set_timestamp_questions
BEFORE UPDATE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ------------------------------------------------------------------
-- drag_and_drop (ENHANCED WITH BETTER CONSTRAINTS)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drag_and_drop_targets (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  target_id   TEXT NOT NULL CHECK (target_id != ''),
  text        TEXT NOT NULL CHECK (text != ''),
  PRIMARY KEY (question_id, target_id)
);

CREATE TABLE IF NOT EXISTS public.drag_and_drop_options (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id   TEXT NOT NULL CHECK (option_id != ''),
  text        TEXT NOT NULL CHECK (text != ''),
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
-- dropdown_selection (KEPT is_correct FOR API COMPATIBILITY)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dropdown_selection_options (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id   TEXT NOT NULL CHECK (option_id != ''),
  text        TEXT NOT NULL CHECK (text != ''),
  is_correct  BOOLEAN NOT NULL, -- Kept for quizApi logic compatibility
  PRIMARY KEY (question_id, option_id)
);

CREATE TABLE IF NOT EXISTS public.dropdown_selection_targets (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  key         TEXT NOT NULL CHECK (key != ''), -- Placeholder key in question text
  value       TEXT NOT NULL CHECK (value != ''), -- Correct option text for this key
  PRIMARY KEY (question_id, key)
);

-- ------------------------------------------------------------------
-- multi (multi-select) - ENHANCED WITH CONSTRAINTS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.multi_options (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id   TEXT NOT NULL CHECK (option_id != ''),
  text        TEXT NOT NULL CHECK (text != ''),
  PRIMARY KEY (question_id, option_id)
);

CREATE TABLE IF NOT EXISTS public.multi_correct_answers (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id   TEXT NOT NULL,
  PRIMARY KEY (question_id, option_id),
  FOREIGN KEY (question_id, option_id)
    REFERENCES public.multi_options(question_id, option_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- single_selection - ENHANCED WITH CONSTRAINTS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.single_selection_options (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id   TEXT NOT NULL CHECK (option_id != ''),
  text        TEXT NOT NULL CHECK (text != ''),
  PRIMARY KEY (question_id, option_id)
);

CREATE TABLE IF NOT EXISTS public.single_selection_correct_answer (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE PRIMARY KEY,
  option_id   TEXT NOT NULL,
  FOREIGN KEY (question_id, option_id)
    REFERENCES public.single_selection_options(question_id, option_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- order - ENHANCED WITH CONSTRAINTS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL CHECK (item_id != ''),
  text        TEXT NOT NULL CHECK (text != ''),
  PRIMARY KEY (question_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.order_correct_order (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL,
  position    INTEGER NOT NULL CHECK (position > 0),
  PRIMARY KEY (question_id, item_id), -- Ensures each item has only one position
  UNIQUE (question_id, position),      -- Ensures each position is used only once per question
  FOREIGN KEY (question_id, item_id)
    REFERENCES public.order_items(question_id, item_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- yes_no - NO CHANGES NEEDED
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yes_no_answer (
  question_id    UUID REFERENCES public.questions(id) ON DELETE CASCADE PRIMARY KEY,
  correct_answer BOOLEAN NOT NULL
);

-- ------------------------------------------------------------------
-- yesno_multi - ENHANCED WITH CONSTRAINTS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yesno_multi_statements (
  question_id  UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  statement_id TEXT NOT NULL CHECK (statement_id != ''),
  text         TEXT NOT NULL CHECK (text != ''),
  PRIMARY KEY (question_id, statement_id)
);

CREATE TABLE IF NOT EXISTS public.yesno_multi_correct_answers (
  question_id    UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  statement_id   TEXT NOT NULL,
  correct_answer BOOLEAN NOT NULL,
  PRIMARY KEY (question_id, statement_id),
  FOREIGN KEY (question_id, statement_id)
    REFERENCES public.yesno_multi_statements(question_id, statement_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- USER QUIZ PROGRESS (UPDATED TO MATCH QUIZZES STRUCTURE)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_quiz_progress (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id                 TEXT        NOT NULL, -- References quizzes.id
  question_type_filter    TEXT,       -- Optional filter for question types
  current_question_index  INTEGER     NOT NULL DEFAULT 0,
  user_answers            JSONB       NOT NULL DEFAULT '{}'::jsonb,
  is_explicitly_completed BOOLEAN     NOT NULL DEFAULT false,
  last_saved_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
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

-- ------------------------------------------------------------------
-- PERMISSIONS
-- ------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
  TO anon, authenticated, service_role;

-- ------------------------------------------------------------------
-- ROW LEVEL SECURITY FOR USER PROGRESS
-- ------------------------------------------------------------------
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

-- ------------------------------------------------------------------
-- HELPFUL VIEWS FOR QUERYING
-- ------------------------------------------------------------------

-- View to get complete quiz information
CREATE OR REPLACE VIEW quiz_complete_info AS
SELECT 
  q.id,
  q.title,
  q.description,
  q.quiz_type,
  q.quiz_tag,
  q.quiz_topic,
  q.difficulty,
  q.author,
  q.settings,
  COUNT(qu.id) as total_questions,
  q.created_at,
  q.updated_at
FROM quizzes q
LEFT JOIN questions qu ON q.id = qu.quiz_tag
GROUP BY q.id, q.title, q.description, q.quiz_type, q.quiz_tag, 
         q.quiz_topic, q.difficulty, q.author, q.settings, q.created_at, q.updated_at;

-- View to get question counts by type for each quiz
CREATE OR REPLACE VIEW quiz_question_type_counts AS
SELECT 
  q.id as quiz_id,
  q.title as quiz_title,
  qu.type as question_type,
  COUNT(qu.id) as question_count
FROM quizzes q
LEFT JOIN questions qu ON q.id = qu.quiz_tag
GROUP BY q.id, q.title, qu.type
ORDER BY q.id, qu.type;

-- ------------------------------------------------------------------
-- DATA VALIDATION FUNCTIONS
-- ------------------------------------------------------------------

-- Function to validate quiz data integrity
CREATE OR REPLACE FUNCTION validate_quiz_integrity(quiz_id_param TEXT)
RETURNS TABLE (
  table_name TEXT,
  issue_description TEXT,
  affected_count BIGINT
) AS $$
BEGIN
  -- Check for questions without any options/answers
  RETURN QUERY
  SELECT 
    'questions'::TEXT,
    'Questions without corresponding answer data'::TEXT,
    COUNT(*)::BIGINT
  FROM questions q
  WHERE q.quiz_tag = quiz_id_param
  AND q.id NOT IN (
    SELECT question_id FROM drag_and_drop_targets WHERE question_id = q.id
    UNION SELECT question_id FROM dropdown_selection_options WHERE question_id = q.id
    UNION SELECT question_id FROM multi_options WHERE question_id = q.id
    UNION SELECT question_id FROM single_selection_options WHERE question_id = q.id
    UNION SELECT question_id FROM order_items WHERE question_id = q.id
    UNION SELECT question_id FROM yes_no_answer WHERE question_id = q.id
    UNION SELECT question_id FROM yesno_multi_statements WHERE question_id = q.id
  );

  -- Add more validation checks as needed
END;
$$ LANGUAGE plpgsql;
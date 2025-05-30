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
CREATE INDEX IF NOT EXISTS idx_questions_type       ON public.questions (type);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_tag   ON public.questions (quiz_tag);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_topic ON public.questions (quiz_topic);
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
  position    INTEGER NOT NULL CHECK (position >= 1),
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

-- ------------------------------------------------------------------
-- SPACED REPETITION & ACTIVE RECALL TABLES
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

-- Add trigger for updated_at on question_responses
DROP TRIGGER IF EXISTS set_timestamp_question_responses ON public.question_responses;
CREATE TRIGGER set_timestamp_question_responses
BEFORE UPDATE ON public.question_responses
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Enable Row Level Security
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;

-- Define Row Level Security policies for question_responses
CREATE POLICY "Users can view their own responses"
  ON public.question_responses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses"
  ON public.question_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
  ON public.question_responses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own responses"
  ON public.question_responses
  FOR DELETE
  USING (auth.uid() = user_id);

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

-- Add trigger for updated_at on user_question_performance
DROP TRIGGER IF EXISTS set_timestamp_user_question_performance ON public.user_question_performance;
CREATE TRIGGER set_timestamp_user_question_performance
BEFORE UPDATE ON public.user_question_performance
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Enable Row Level Security
ALTER TABLE public.user_question_performance ENABLE ROW LEVEL SECURITY;

-- Define Row Level Security policies for user_question_performance
CREATE POLICY "Users can view their own performance"
  ON public.user_question_performance
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance"
  ON public.user_question_performance
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own performance"
  ON public.user_question_performance
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own performance"
  ON public.user_question_performance
  FOR DELETE
  USING (auth.uid() = user_id);

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

-- Add trigger for updated_at on adaptive_quiz_sessions
DROP TRIGGER IF EXISTS set_timestamp_adaptive_quiz_sessions ON public.adaptive_quiz_sessions;
CREATE TRIGGER set_timestamp_adaptive_quiz_sessions
BEFORE UPDATE ON public.adaptive_quiz_sessions
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Enable Row Level Security
ALTER TABLE public.adaptive_quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Define Row Level Security policies for adaptive_quiz_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.adaptive_quiz_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.adaptive_quiz_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.adaptive_quiz_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.adaptive_quiz_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------
-- SM-2 ALGORITHM FUNCTIONS FOR SPACED REPETITION
-- ------------------------------------------------------------------

-- Core SM-2 algorithm function that calculates spaced repetition parameters
CREATE OR REPLACE FUNCTION fn_calculate_sm2_review_details(
  current_ease_factor DECIMAL DEFAULT 2.5,
  current_interval INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  quality_rating INTEGER DEFAULT 3
)
RETURNS TABLE (
  new_ease_factor DECIMAL,
  new_interval_days INTEGER,
  new_repetitions INTEGER,
  next_review_date TIMESTAMPTZ
) AS $$
DECLARE
  ef DECIMAL;
  interval_days INTEGER;
  reps INTEGER;
BEGIN
  -- Validate input parameters
  IF quality_rating < 0 OR quality_rating > 5 THEN
    RAISE EXCEPTION 'Quality rating must be between 0 and 5, got %', quality_rating;
  END IF;
  
  IF current_ease_factor < 1.3 THEN
    current_ease_factor := 1.3;
  END IF;
  
  -- SM-2 Algorithm Implementation
  reps := repetitions;
  
  -- If quality is less than 3, reset repetitions and set interval to 1
  IF quality_rating < 3 THEN
    reps := 0;
    interval_days := 1;
  ELSE
    reps := repetitions + 1;
    
    -- Calculate interval based on repetitions
    IF reps = 1 THEN
      interval_days := 1;
    ELSIF reps = 2 THEN
      interval_days := 6;
    ELSE
      interval_days := ROUND(current_interval * current_ease_factor);
    END IF;
  END IF;
  
  -- Calculate new ease factor using SM-2 formula
  -- EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  ef := current_ease_factor + (0.1 - (5 - quality_rating) * (0.08 + (5 - quality_rating) * 0.02));
  
  -- Ensure ease factor stays within reasonable bounds
  IF ef < 1.3 THEN
    ef := 1.3;
  ELSIF ef > 2.5 THEN
    ef := 2.5;
  END IF;
  
  -- Ensure minimum interval
  IF interval_days < 1 THEN
    interval_days := 1;
  END IF;
  
  RETURN QUERY SELECT 
    ef,
    interval_days,
    reps,
    (NOW() + INTERVAL '1 day' * interval_days)::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql;

-- Wrapper function for easier SM-2 calculations with simplified interface
CREATE OR REPLACE FUNCTION calculate_next_review_date(
  p_user_id UUID,
  p_question_id UUID,
  p_quality_rating INTEGER
)
RETURNS TABLE (
  ease_factor DECIMAL,
  interval_days INTEGER,
  repetitions INTEGER,
  next_review_date TIMESTAMPTZ
) AS $$
DECLARE
  current_performance RECORD;
  sm2_result RECORD;
BEGIN
  -- Get current performance data or use defaults for new questions
  SELECT 
    COALESCE(uqp.ease_factor, 2.5) as current_ease_factor,
    COALESCE(uqp.interval_days, 1) as current_interval,
    COALESCE(uqp.repetitions, 0) as current_repetitions
  INTO current_performance
  FROM public.user_question_performance uqp
  WHERE uqp.user_id = p_user_id AND uqp.question_id = p_question_id;
  
  -- If no existing performance record, use defaults
  IF current_performance IS NULL THEN
    current_performance := ROW(2.5, 1, 0);
  END IF;
  
  -- Calculate new SM-2 parameters
  SELECT * INTO sm2_result
  FROM fn_calculate_sm2_review_details(
    current_performance.current_ease_factor,
    current_performance.current_interval,
    current_performance.current_repetitions,
    p_quality_rating
  );
  
  RETURN QUERY SELECT 
    sm2_result.new_ease_factor,
    sm2_result.new_interval_days,
    sm2_result.new_repetitions,
    sm2_result.next_review_date;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------
-- PERFORMANCE TRACKING TRIGGER FUNCTIONS
-- ------------------------------------------------------------------

-- Function to update user question performance when a response is submitted
CREATE OR REPLACE FUNCTION fn_update_user_question_performance()
RETURNS TRIGGER AS $$
DECLARE
  quality_rating INTEGER;
  sm2_result RECORD;
  current_perf RECORD;
  new_priority_score DECIMAL;
  avg_time INTEGER;
BEGIN
  -- Determine quality rating from response (simplified logic)
  -- This can be enhanced based on response_time_ms and confidence_level
  IF NEW.is_correct THEN
    -- Correct answer: base quality 4, can be adjusted by response time
    quality_rating := 4;
    IF NEW.response_time_ms <= 5000 THEN -- Fast response (5 seconds or less)
      quality_rating := 5;
    ELSIF NEW.response_time_ms > 20000 THEN -- Slow response (20+ seconds)
      quality_rating := 3;
    END IF;
  ELSE
    -- Incorrect answer: base quality 1, can be slightly adjusted
    quality_rating := 1;
    IF NEW.confidence_level IS NOT NULL AND NEW.confidence_level <= 2 THEN
      quality_rating := 2; -- At least they knew they were unsure
    END IF;
  END IF;
  
  -- Get current performance or initialize defaults
  SELECT * INTO current_perf
  FROM public.user_question_performance uqp
  WHERE uqp.user_id = NEW.user_id AND uqp.question_id = NEW.question_id;
  
  -- Calculate new SM-2 parameters
  SELECT * INTO sm2_result
  FROM calculate_next_review_date(NEW.user_id, NEW.question_id, quality_rating);
  
  -- Calculate new average response time
  IF current_perf IS NOT NULL THEN
    avg_time := ROUND((COALESCE(current_perf.avg_response_time_ms, 0) * current_perf.total_attempts + NEW.response_time_ms) / (current_perf.total_attempts + 1));
  ELSE
    avg_time := NEW.response_time_ms;
  END IF;
  
  -- Calculate priority score (higher = more important to review)
  -- Base on incorrect streak, time since last review, and ease factor
  new_priority_score := 0.0;
  IF current_perf IS NOT NULL THEN
    new_priority_score := current_perf.incorrect_streak * 10.0; -- Heavy weight on incorrect streaks
    IF NOT NEW.is_correct THEN
      new_priority_score := new_priority_score + 5.0; -- Boost for recent incorrect
    END IF;
    new_priority_score := new_priority_score + (3.0 - sm2_result.ease_factor); -- Lower ease = higher priority
  ELSE
    IF NOT NEW.is_correct THEN
      new_priority_score := 15.0; -- High priority for first incorrect attempt
    ELSE
      new_priority_score := 1.0; -- Low priority for first correct attempt
    END IF;
  END IF;
  
  -- Upsert user_question_performance record
  INSERT INTO public.user_question_performance (
    user_id,
    question_id,
    ease_factor,
    interval_days,
    repetitions,
    next_review_date,
    correct_streak,
    incorrect_streak,
    total_attempts,
    correct_attempts,
    avg_response_time_ms,
    priority_score,
    last_reviewed_at
  ) VALUES (
    NEW.user_id,
    NEW.question_id,
    sm2_result.ease_factor,
    sm2_result.interval_days,
    sm2_result.repetitions,
    sm2_result.next_review_date,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    CASE WHEN NEW.is_correct THEN 0 ELSE 1 END,
    1,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    avg_time,
    new_priority_score,
    NEW.submitted_at
  )
  ON CONFLICT (user_id, question_id) DO UPDATE SET
    ease_factor = sm2_result.ease_factor,
    interval_days = sm2_result.interval_days,
    repetitions = sm2_result.repetitions,
    next_review_date = sm2_result.next_review_date,
    correct_streak = CASE 
      WHEN NEW.is_correct THEN user_question_performance.correct_streak + 1 
      ELSE 0 
    END,
    incorrect_streak = CASE 
      WHEN NEW.is_correct THEN 0 
      ELSE user_question_performance.incorrect_streak + 1 
    END,
    total_attempts = user_question_performance.total_attempts + 1,
    correct_attempts = user_question_performance.correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    avg_response_time_ms = avg_time,
    priority_score = new_priority_score,
    last_reviewed_at = NEW.submitted_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on question_responses to automatically update performance
DROP TRIGGER IF EXISTS trigger_update_user_question_performance ON public.question_responses;
CREATE TRIGGER trigger_update_user_question_performance
  AFTER INSERT ON public.question_responses
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_user_question_performance();

-- ------------------------------------------------------------------
-- REVIEW QUESTION RETRIEVAL FUNCTIONS
-- ------------------------------------------------------------------

-- Function to get questions due for review for a specific user
CREATE OR REPLACE FUNCTION get_questions_due_for_review(
  p_user_id UUID,
  p_quiz_topic_filter TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  question_id UUID,
  question_text TEXT,
  question_type question_type,
  quiz_topic TEXT,
  difficulty difficulty,
  points INTEGER,
  next_review_date TIMESTAMPTZ,
  ease_factor DECIMAL,
  interval_days INTEGER,
  repetitions INTEGER,
  correct_streak INTEGER,
  incorrect_streak INTEGER,
  priority_score DECIMAL,
  total_attempts INTEGER,
  correct_attempts INTEGER,
  last_reviewed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH questions_with_performance AS (
    -- Get all questions with their performance data (if any)
    SELECT 
      q.id as question_id,
      q.question as question_text,
      q.type as question_type,
      q.quiz_topic,
      q.difficulty,
      q.points,
      COALESCE(uqp.next_review_date, NOW()) as next_review_date,
      COALESCE(uqp.ease_factor, 2.5) as ease_factor,
      COALESCE(uqp.interval_days, 1) as interval_days,
      COALESCE(uqp.repetitions, 0) as repetitions,
      COALESCE(uqp.correct_streak, 0) as correct_streak,
      COALESCE(uqp.incorrect_streak, 0) as incorrect_streak,
      COALESCE(uqp.priority_score, 
        -- Default priority for never-attempted questions
        CASE 
          WHEN q.difficulty = 'hard' THEN 5.0
          WHEN q.difficulty = 'medium' THEN 3.0
          ELSE 1.0
        END
      ) as priority_score,
      COALESCE(uqp.total_attempts, 0) as total_attempts,
      COALESCE(uqp.correct_attempts, 0) as correct_attempts,
      uqp.last_reviewed_at
    FROM public.questions q
    LEFT JOIN public.user_question_performance uqp 
      ON q.id = uqp.question_id AND uqp.user_id = p_user_id
    WHERE 
      -- Filter by quiz topic if specified
      (p_quiz_topic_filter IS NULL OR q.quiz_topic = p_quiz_topic_filter)
  ),
  due_questions AS (
    SELECT *
    FROM questions_with_performance
    WHERE 
      -- Question is due for review (either never reviewed or past due date)
      next_review_date <= NOW()
      -- Include questions that have never been attempted
      OR total_attempts = 0
  )
  SELECT 
    dq.question_id,
    dq.question_text,
    dq.question_type,
    dq.quiz_topic,
    dq.difficulty,
    dq.points,
    dq.next_review_date,
    dq.ease_factor,
    dq.interval_days,
    dq.repetitions,
    dq.correct_streak,
    dq.incorrect_streak,
    dq.priority_score,
    dq.total_attempts,
    dq.correct_attempts,
    dq.last_reviewed_at
  FROM due_questions dq
  ORDER BY 
    -- Prioritize by priority score (high = urgent), then by next review date (oldest first)
    dq.priority_score DESC,
    dq.next_review_date ASC,
    -- Tie-breaker: questions never attempted come first
    CASE WHEN dq.total_attempts = 0 THEN 0 ELSE 1 END,
    -- Final tie-breaker: difficulty (hard first)
    CASE 
      WHEN dq.difficulty = 'hard' THEN 0
      WHEN dq.difficulty = 'medium' THEN 1
      ELSE 2
    END
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------
-- PERFORMANCE OPTIMIZATION AND ADDITIONAL INDEXES
-- ------------------------------------------------------------------

-- Additional performance indexes for spaced repetition queries
CREATE INDEX IF NOT EXISTS idx_user_question_performance_user_priority ON public.user_question_performance (user_id, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_question_performance_topic_review ON public.user_question_performance 
  USING btree (user_id) INCLUDE (next_review_date, priority_score);

-- Composite index for efficient review question retrieval
CREATE INDEX IF NOT EXISTS idx_questions_topic_difficulty ON public.questions (quiz_topic, difficulty);

-- Index for question response analytics
CREATE INDEX IF NOT EXISTS idx_question_responses_user_submitted ON public.question_responses (user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_responses_question_correct ON public.question_responses (question_id, is_correct, submitted_at);

-- Index for adaptive session queries
CREATE INDEX IF NOT EXISTS idx_adaptive_sessions_user_topic_created ON public.adaptive_quiz_sessions (user_id, quiz_topic, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_adaptive_sessions_completed ON public.adaptive_quiz_sessions (user_id, completed_at) WHERE completed_at IS NOT NULL;

-- Partial index for questions that need review (performance optimization)
-- Note: Removed NOW() from WHERE clause as it's not immutable and causes index creation errors
CREATE INDEX IF NOT EXISTS idx_user_question_performance_due_review ON public.user_question_performance (user_id, next_review_date, priority_score DESC);

-- ------------------------------------------------------------------
-- PERFORMANCE MONITORING AND STATISTICS FUNCTIONS
-- ------------------------------------------------------------------

-- Function to get spaced repetition statistics for a user
CREATE OR REPLACE FUNCTION get_user_spaced_repetition_stats(p_user_id UUID)
RETURNS TABLE (
  total_questions_reviewed INTEGER,
  questions_due_today INTEGER,
  questions_due_this_week INTEGER,
  average_ease_factor DECIMAL,
  accuracy_rate DECIMAL,
  average_response_time_ms INTEGER,
  mastered_questions INTEGER,
  struggling_questions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COUNT(*)::INTEGER as total_reviewed,
      COUNT(CASE WHEN uqp.next_review_date::date = CURRENT_DATE THEN 1 END)::INTEGER as due_today,
      COUNT(CASE WHEN uqp.next_review_date::date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 END)::INTEGER as due_week,
      AVG(uqp.ease_factor) as avg_ease,
      CASE 
        WHEN SUM(uqp.total_attempts) > 0 THEN 
          (SUM(uqp.correct_attempts)::DECIMAL / SUM(uqp.total_attempts)) * 100
        ELSE 0
      END as accuracy,
      AVG(uqp.avg_response_time_ms)::INTEGER as avg_time,
      COUNT(CASE WHEN uqp.ease_factor > 2.3 AND uqp.interval_days > 30 THEN 1 END)::INTEGER as mastered,
      COUNT(CASE WHEN uqp.incorrect_streak >= 2 OR uqp.ease_factor < 1.5 THEN 1 END)::INTEGER as struggling
    FROM public.user_question_performance uqp
    WHERE uqp.user_id = p_user_id
  )
  SELECT 
    us.total_reviewed,
    us.due_today,
    us.due_week,
    COALESCE(us.avg_ease, 2.5),
    COALESCE(us.accuracy, 0),
    COALESCE(us.avg_time, 0),
    us.mastered,
    us.struggling
  FROM user_stats us;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
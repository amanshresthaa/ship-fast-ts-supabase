-- =================================================================
-- DATABASE MIGRATION SCRIPT - Apply Enhanced Constraints & Features
-- =================================================================
-- This script safely updates an existing database with the new enhancements
-- Run this AFTER your initial schema is created and data is migrated

-- ------------------------------------------------------------------
-- STEP 1: Add missing columns (safe for existing data)
-- ------------------------------------------------------------------

-- Add updated_at to user_quiz_progress if it doesn't exist
ALTER TABLE public.user_quiz_progress 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ------------------------------------------------------------------
-- STEP 2: Add triggers for timestamp updates
-- ------------------------------------------------------------------

-- Ensure the trigger function exists
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for user_quiz_progress updated_at
DROP TRIGGER IF EXISTS set_timestamp_user_quiz_progress ON public.user_quiz_progress;
CREATE TRIGGER set_timestamp_user_quiz_progress
BEFORE UPDATE ON public.user_quiz_progress
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Ensure other triggers exist
DROP TRIGGER IF EXISTS set_timestamp_quizzes ON public.quizzes;
CREATE TRIGGER set_timestamp_quizzes
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_questions ON public.questions;
CREATE TRIGGER set_timestamp_questions
BEFORE UPDATE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ------------------------------------------------------------------
-- STEP 3: Add missing indexes for better performance
-- ------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_quizzes_topic      ON public.quizzes (quiz_topic);
CREATE INDEX IF NOT EXISTS idx_quizzes_difficulty ON public.quizzes (difficulty);
CREATE INDEX IF NOT EXISTS idx_quizzes_quiz_tag   ON public.quizzes (quiz_tag);
CREATE INDEX IF NOT EXISTS idx_quizzes_quiz_type  ON public.quizzes (quiz_type);

CREATE INDEX IF NOT EXISTS idx_questions_type       ON public.questions (type);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_tag   ON public.questions (quiz_tag);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions (difficulty);

CREATE INDEX IF NOT EXISTS idx_user_quiz_progress_user_id ON public.user_quiz_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_progress_user_quiz ON public.user_quiz_progress (user_id, quiz_id, question_type_filter);
CREATE INDEX IF NOT EXISTS idx_user_quiz_progress_last_saved ON public.user_quiz_progress (last_saved_at);

-- ------------------------------------------------------------------
-- STEP 4: Create helpful views
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
-- STEP 5: Create validation function
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

  -- Check for orphaned answer data
  RETURN QUERY
  SELECT 
    'orphaned_answers'::TEXT,
    'Answer data without corresponding questions'::TEXT,
    (SELECT COUNT(*) FROM drag_and_drop_targets dt 
     WHERE NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = dt.question_id))::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------
-- STEP 6: Add CHECK constraints (ONLY run if you're sure your data is clean)
-- ------------------------------------------------------------------

-- WARNING: These constraints will fail if you have empty strings in your data
-- Clean your data first, then uncomment these lines:

/*
-- Clean any empty strings first (uncomment and modify as needed):
-- UPDATE quizzes SET title = 'Untitled Quiz' WHERE title = '';
-- UPDATE questions SET question = 'Missing question text' WHERE question = '';

-- Then add the constraints:
ALTER TABLE public.quizzes 
  ADD CONSTRAINT chk_quizzes_id_not_empty CHECK (id != ''),
  ADD CONSTRAINT chk_quizzes_title_not_empty CHECK (title != ''),
  ADD CONSTRAINT chk_quizzes_quiz_type_not_empty CHECK (quiz_type IS NULL OR quiz_type != ''),
  ADD CONSTRAINT chk_quizzes_quiz_tag_not_empty CHECK (quiz_tag != ''),
  ADD CONSTRAINT chk_quizzes_author_not_empty CHECK (author IS NULL OR author != ''),
  ADD CONSTRAINT chk_quizzes_quiz_topic_not_empty CHECK (quiz_topic IS NULL OR quiz_topic != '');

ALTER TABLE public.questions
  ADD CONSTRAINT chk_questions_question_not_empty CHECK (question != ''),
  ADD CONSTRAINT chk_questions_quiz_tag_not_empty CHECK (quiz_tag != ''),
  ADD CONSTRAINT chk_questions_explanation_not_empty CHECK (explanation IS NULL OR explanation != ''),
  ADD CONSTRAINT chk_questions_feedback_correct_not_empty CHECK (feedback_correct != ''),
  ADD CONSTRAINT chk_questions_feedback_incorrect_not_empty CHECK (feedback_incorrect != '');
*/

-- ------------------------------------------------------------------
-- STEP 7: Grant permissions
-- ------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
  TO anon, authenticated, service_role;
GRANT SELECT ON ALL VIEWS IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION validate_quiz_integrity(TEXT) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------
-- STEP 8: Enable RLS if not already enabled
-- ------------------------------------------------------------------

ALTER TABLE public.user_quiz_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  -- Check if policies exist, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_quiz_progress' 
    AND policyname = 'Users can view their own progress'
  ) THEN
    CREATE POLICY "Users can view their own progress"
      ON public.user_quiz_progress
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_quiz_progress' 
    AND policyname = 'Users can insert their own progress'
  ) THEN
    CREATE POLICY "Users can insert their own progress"
      ON public.user_quiz_progress
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_quiz_progress' 
    AND policyname = 'Users can update their own progress'
  ) THEN
    CREATE POLICY "Users can update their own progress"
      ON public.user_quiz_progress
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_quiz_progress' 
    AND policyname = 'Users can delete their own progress'
  ) THEN
    CREATE POLICY "Users can delete their own progress"
      ON public.user_quiz_progress
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- ------------------------------------------------------------------
-- VERIFICATION QUERIES
-- ------------------------------------------------------------------

-- Run these to verify the migration was successful:

-- 1. Check that all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check that all indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 3. Check that all views exist
SELECT table_name as view_name
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 4. Check that triggers exist
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 5. Test the validation function
-- SELECT * FROM validate_quiz_integrity('your-quiz-id-here');

PRINT 'Migration completed successfully! ✅';

-- Validation Queries for Quiz Sub-Type Migration

-- 1. Check if quiz_sub_types table exists and has the correct columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'quiz_sub_types'
ORDER BY ordinal_position;

-- Expected columns for quiz_sub_types:
-- id           SERIAL (integer, auto-incrementing) PRIMARY KEY
-- name         TEXT          NOT NULL UNIQUE
-- created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
-- updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()

-- 2. Verify initial data in quiz_sub_types
SELECT id, name FROM public.quiz_sub_types ORDER BY name;
-- Expected:
-- ('computer-vision'),
-- ('knowledge-mining'),
-- ('nlp-solutions'),
-- ('solution-planning')

-- 3. Check if quiz_sub_type_id column was added to quizzes table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'quizzes' AND column_name = 'quiz_sub_type_id';
-- Expected: quiz_sub_type_id, integer, YES (nullable)

-- 4. Check foreign key constraint on quizzes.quiz_sub_type_id
SELECT constraint_name, unique_constraint_name, match_option, update_rule, delete_rule
FROM information_schema.referential_constraints
WHERE constraint_schema = 'public' AND constraint_name = 'fk_quizzes_quiz_sub_type';
-- Expected: fk_quizzes_quiz_sub_type, refers to quiz_sub_types(id), ON DELETE SET NULL (or RESTRICT)

-- 5. Check index on quizzes.quiz_sub_type_id
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'quizzes' AND indexname = 'idx_quizzes_quiz_sub_type_id';
-- Expected: idx_quizzes_quiz_sub_type_id, definition of the index

-- 6. Check if quiz_sub_type_id column was added to questions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'quiz_sub_type_id';
-- Expected: quiz_sub_type_id, integer, YES (nullable)

-- 7. Check foreign key constraint on questions.quiz_sub_type_id
SELECT constraint_name, unique_constraint_name, match_option, update_rule, delete_rule
FROM information_schema.referential_constraints
WHERE constraint_schema = 'public' AND constraint_name = 'fk_questions_quiz_sub_type';
-- Expected: fk_questions_quiz_sub_type, refers to quiz_sub_types(id), ON DELETE SET NULL (or RESTRICT)

-- 8. Check index on questions.quiz_sub_type_id
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'questions' AND indexname = 'idx_questions_quiz_sub_type_id';
-- Expected: idx_questions_quiz_sub_type_id, definition of the index

-- 9. Check population of quizzes.quiz_sub_type_id (heuristic - count NULLs vs NON-NULLs)
-- This query depends on the 004_populate_quizzes_sub_type_id.sql script being run and having actual logic.
-- If it's still a placeholder, most/all will be NULL.
SELECT
  COUNT(*) AS total_quizzes,
  COUNT(CASE WHEN quiz_sub_type_id IS NULL THEN 1 END) AS quizzes_without_subtype,
  COUNT(CASE WHEN quiz_sub_type_id IS NOT NULL THEN 1 END) AS quizzes_with_subtype
FROM public.quizzes;

-- 10. Check population of questions.quiz_sub_type_id based on parent quiz
-- This query depends on the 006_populate_questions_sub_type_id.sql script.
SELECT
  COUNT(q.id) AS total_questions,
  COUNT(CASE WHEN q.quiz_sub_type_id IS NULL THEN 1 END) AS questions_without_subtype,
  COUNT(CASE WHEN q.quiz_sub_type_id IS NOT NULL THEN 1 END) AS questions_with_subtype,
  COUNT(CASE WHEN q.quiz_sub_type_id = qz.quiz_sub_type_id THEN 1 END) AS questions_matching_parent_quiz_subtype
FROM public.questions q
LEFT JOIN public.quizzes qz ON q.quiz_tag = qz.id; -- Assuming quiz_tag is the FK to quizzes.id

-- 11. Optional: Check for any quizzes/questions linked to non-existent sub-types (should be none if FKs are working)
SELECT q.id AS quiz_id, q.quiz_sub_type_id
FROM public.quizzes q
LEFT JOIN public.quiz_sub_types qst ON q.quiz_sub_type_id = qst.id
WHERE q.quiz_sub_type_id IS NOT NULL AND qst.id IS NULL;

SELECT qn.id AS question_id, qn.quiz_sub_type_id
FROM public.questions qn
LEFT JOIN public.quiz_sub_types qst ON qn.quiz_sub_type_id = qst.id
WHERE qn.quiz_sub_type_id IS NOT NULL AND qst.id IS NULL;

COMMENT ON SCHEMA public IS 'Contains validation queries for the quiz sub-type migration. These queries help verify that the schema changes were applied correctly and data integrity is maintained.';

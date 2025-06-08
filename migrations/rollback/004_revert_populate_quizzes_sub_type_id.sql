-- Rollback script for 004_populate_quizzes_sub_type_id.sql
-- Sets the quiz_sub_type_id column in the quizzes table to NULL.

ALTER TABLE public.quizzes
ALTER COLUMN quiz_sub_type_id DROP NOT NULL; -- If it was ever made NOT NULL

UPDATE public.quizzes
SET quiz_sub_type_id = NULL
WHERE quiz_sub_type_id IS NOT NULL;

COMMENT ON COLUMN public.quizzes.quiz_sub_type_id IS 'Foreign key linking to the quiz_sub_types table. Value nulled out by rollback script.';

-- Rollback script for 006_populate_questions_sub_type_id.sql
-- Sets the quiz_sub_type_id column in the questions table to NULL.

ALTER TABLE public.questions
ALTER COLUMN quiz_sub_type_id DROP NOT NULL; -- If it was ever made NOT NULL

UPDATE public.questions
SET quiz_sub_type_id = NULL
WHERE quiz_sub_type_id IS NOT NULL;

COMMENT ON COLUMN public.questions.quiz_sub_type_id IS 'Foreign key linking to the quiz_sub_types table. Value nulled out by rollback script.';

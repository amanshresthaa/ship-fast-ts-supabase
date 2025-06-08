-- Rollback script for 002_populate_quiz_sub_types.sql
-- Deletes the specific sub-type data inserted by script 002.
-- This should be run BEFORE dropping the quiz_sub_types table if FKs are restrictive.
-- However, our FKs are ON DELETE SET NULL, so order is less critical w.r.t table drop.
-- For safety, we assume this runs before 001_revert_create_quiz_sub_types_table.sql

DELETE FROM public.quiz_sub_types
WHERE name IN (
  'computer-vision',
  'knowledge-mining',
  'nlp-solutions',
  'solution-planning'
);

COMMENT ON TABLE public.quiz_sub_types IS 'Stores the different sub-types or categories for quizzes. Seed data removed by rollback.';

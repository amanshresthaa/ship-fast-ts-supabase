-- Populate quiz_sub_type_id in the questions table
-- This script assumes that questions should inherit the sub-type from their parent quiz.
-- It relies on quizzes.quiz_sub_type_id being populated by a previous script (004_populate_quizzes_sub_type_id.sql).

UPDATE public.questions q
SET quiz_sub_type_id = (
  SELECT qz.quiz_sub_type_id
  FROM public.quizzes qz
  WHERE qz.id = q.quiz_tag -- quiz_tag is the FK to quizzes.id
)
WHERE q.quiz_sub_type_id IS NULL; -- Only update if not already set

COMMENT ON COLUMN public.questions.quiz_sub_type_id IS 'Foreign key linking to the quiz_sub_types table. This script populates the column based on parent quiz''s sub-type.';

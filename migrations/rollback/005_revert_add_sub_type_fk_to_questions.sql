-- Rollback script for 005_add_sub_type_fk_to_questions.sql
-- Removes the quiz_sub_type_id column and its associated constraints/indexes from the questions table.

-- Drop the index first
DROP INDEX IF EXISTS public.idx_questions_quiz_sub_type_id;

-- Drop the foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_questions_quiz_sub_type'
      AND table_name = 'questions'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.questions
    DROP CONSTRAINT fk_questions_quiz_sub_type;
  END IF;
END $$;

-- Drop the column
ALTER TABLE public.questions
DROP COLUMN IF EXISTS quiz_sub_type_id;

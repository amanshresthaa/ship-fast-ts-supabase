-- Rollback script for 003_add_sub_type_fk_to_quizzes.sql
-- Removes the quiz_sub_type_id column and its associated constraints/indexes from the quizzes table.

-- Drop the index first
DROP INDEX IF EXISTS public.idx_quizzes_quiz_sub_type_id;

-- Drop the foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_quizzes_quiz_sub_type'
      AND table_name = 'quizzes'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.quizzes
    DROP CONSTRAINT fk_quizzes_quiz_sub_type;
  END IF;
END $$;

-- Drop the column
ALTER TABLE public.quizzes
DROP COLUMN IF EXISTS quiz_sub_type_id;

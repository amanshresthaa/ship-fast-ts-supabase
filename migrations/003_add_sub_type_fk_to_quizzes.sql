-- Add quiz_sub_type_id column to quizzes table
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS quiz_sub_type_id INTEGER;

-- Add foreign key constraint
-- Ensuring the referenced table and its PK are available before adding constraint
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quiz_sub_types') THEN
    ALTER TABLE public.quizzes
    ADD CONSTRAINT fk_quizzes_quiz_sub_type
    FOREIGN KEY (quiz_sub_type_id)
    REFERENCES public.quiz_sub_types(id)
    ON DELETE SET NULL; -- Or ON DELETE RESTRICT, depending on desired behavior
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_quizzes_quiz_sub_type_id ON public.quizzes (quiz_sub_type_id);

COMMENT ON COLUMN public.quizzes.quiz_sub_type_id IS 'Foreign key linking to the quiz_sub_types table.';

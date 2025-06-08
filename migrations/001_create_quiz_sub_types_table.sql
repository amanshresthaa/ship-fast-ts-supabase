-- Enable UUID generation if not already enabled (used by other tables, good to ensure)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Already in user's schema, might not be needed here

-- Utility Function for Timestamps (assuming it's globally available as per user schema)
-- CREATE OR REPLACE FUNCTION trigger_set_timestamp() ... ; -- Not redefining if already exists

-- Create quiz_sub_types table
CREATE TABLE IF NOT EXISTS public.quiz_sub_types (
  id           SERIAL        PRIMARY KEY,
  name         TEXT          NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Add trigger for updated_at on quiz_sub_types
DROP TRIGGER IF EXISTS set_timestamp_quiz_sub_types ON public.quiz_sub_types;
CREATE TRIGGER set_timestamp_quiz_sub_types
BEFORE UPDATE ON public.quiz_sub_types
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

COMMENT ON TABLE public.quiz_sub_types IS 'Stores the different sub-types or categories for quizzes.';
COMMENT ON COLUMN public.quiz_sub_types.name IS 'The unique name of the quiz sub-type (e.g., computer-vision)';

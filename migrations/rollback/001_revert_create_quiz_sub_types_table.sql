-- Rollback script for 001_create_quiz_sub_types_table.sql
-- Drops the quiz_sub_types table.

-- Drop the trigger associated with the table first (if it exists)
DROP TRIGGER IF EXISTS set_timestamp_quiz_sub_types ON public.quiz_sub_types;

-- Drop the table
DROP TABLE IF EXISTS public.quiz_sub_types;

-- The trigger_set_timestamp function is assumed to be used by other tables,
-- so it is NOT dropped here.

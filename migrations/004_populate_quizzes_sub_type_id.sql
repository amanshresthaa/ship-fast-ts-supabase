-- Placeholder script for populating quiz_sub_type_id in the quizzes table.
--
-- IMPORTANT: The actual mapping logic needs to be provided based on business rules.
-- This script should be manually updated with CASE statements or other logic
-- to determine the correct sub-type for each existing quiz.
--
-- Example (conceptual - replace with actual rules):
/*
UPDATE public.quizzes
SET quiz_sub_type_id =
  CASE
    -- Example: Map based on quiz_topic
    WHEN quiz_topic = 'Azure AI Vision Services' THEN (SELECT id FROM public.quiz_sub_types WHERE name = 'computer-vision')
    WHEN quiz_topic = 'Azure Cognitive Search' THEN (SELECT id FROM public.quiz_sub_types WHERE name = 'knowledge-mining')
    WHEN quiz_topic = 'Azure NLP Solutions' THEN (SELECT id FROM public.quiz_sub_types WHERE name = 'nlp-solutions')
    -- Example: Map based on quiz ID patterns
    WHEN id LIKE 'cv-%' THEN (SELECT id FROM public.quiz_sub_types WHERE name = 'computer-vision')
    WHEN id LIKE 'km-%' THEN (SELECT id FROM public.quiz_sub_types WHERE name = 'knowledge-mining')
    -- Add more specific rules here based on your data
    ELSE NULL -- Or assign a default sub-type, or raise an error
  END
WHERE quiz_sub_type_id IS NULL; -- Only update if not already set
*/

-- For now, this script will be a comment block.
-- Remove this comment and add actual UPDATE statements when mapping logic is defined.

COMMENT ON COLUMN public.quizzes.quiz_sub_type_id IS 'Foreign key linking to the quiz_sub_types table. This script is a placeholder for populating this column for existing quizzes.';

-- Sample Seed Data Template for Quizzes and Questions with Sub-Types
--
-- This template provides examples of how to insert data into the quizzes
-- and questions tables, ensuring they are linked to the appropriate quiz_sub_types.
--
-- Instructions:
-- 1. Replace placeholder values (e.g., 'Your Quiz Topic Here', 'Sample Question 1?') with actual data.
-- 2. Ensure the `quiz_sub_type_id` corresponds to an existing ID in the `public.quiz_sub_types` table.
--    You can query `SELECT id, name FROM public.quiz_sub_types;` to get available sub-types.
-- 3. The `quiz_tag` in the `questions` table should match the `id` of the quiz it belongs to.
--    If you are inserting quizzes and questions in the same script, you might need to
--    use `currval(pg_get_serial_sequence('public.quizzes', 'id'))` or similar techniques if your quiz IDs are serial.
--    For simplicity, this template assumes you know the quiz ID or are setting it manually (if not serial).
--
-- Best Practice: Wrap your DML statements in a transaction if inserting multiple related records.
-- BEGIN;
-- ... your INSERT statements ...
-- COMMIT;

/*
-- Example: Inserting a 'computer-vision' quiz and its questions

-- First, get the ID for the 'computer-vision' sub-type
-- This could be done in your application logic or as a CTE/subquery if needed.
-- For this template, we'll assume you've looked it up. Example: (SELECT id FROM public.quiz_sub_types WHERE name = 'computer-vision')

-- Insert a Quiz for 'computer-vision'
INSERT INTO public.quizzes (
  id, -- Optional if SERIAL and you want auto-generation, but explicit for clarity in seeds
  quiz_topic,
  difficulty_level,
  quiz_sub_type_id, -- Link to the sub-type
  -- created_by, -- Assuming you have such columns
  -- updated_by,
  created_at,
  updated_at
  -- Add other relevant quiz columns
) VALUES (
  101, -- Example Quiz ID
  'Introduction to Image Classification',
  'Beginner',
  (SELECT id FROM public.quiz_sub_types WHERE name = 'computer-vision'), -- FK to quiz_sub_types
  -- 'seed_script_user',
  -- 'seed_script_user',
  NOW(),
  NOW()
  -- Add other values
);

-- Insert Questions for the 'computer-vision' Quiz (ID: 101)
INSERT INTO public.questions (
  id, -- Optional if SERIAL
  quiz_tag, -- FK to quizzes.id
  question_text,
  correct_answer,
  explanation,
  quiz_sub_type_id, -- Inherit or set sub-type, usually same as quiz
  -- created_by,
  -- updated_by,
  created_at,
  updated_at
  -- Add other relevant question columns
) VALUES (
  1001, -- Example Question ID
  101,  -- Links to the quiz with ID 101
  'What is the primary goal of image classification?',
  'To assign a label to an image from a predefined set of categories.',
  'Image classification aims to categorize an image based on its visual content.',
  (SELECT id FROM public.quiz_sub_types WHERE name = 'computer-vision'), -- FK to quiz_sub_types
  -- 'seed_script_user',
  -- 'seed_script_user',
  NOW(),
  NOW()
  -- Add other values
),
(
  1002, -- Example Question ID
  101,  -- Links to the quiz with ID 101
  'Which of these is a common dataset used for benchmarking image classification models?',
  'ImageNet',
  'ImageNet is a large-scale dataset widely used in the computer vision community.',
  (SELECT id FROM public.quiz_sub_types WHERE name = 'computer-vision'), -- FK to quiz_sub_types
  -- 'seed_script_user',
  -- 'seed_script_user',
  NOW(),
  NOW()
  -- Add other values
);

-- Example: Inserting an 'nlp-solutions' quiz and its questions

-- Insert a Quiz for 'nlp-solutions'
INSERT INTO public.quizzes (
  id,
  quiz_topic,
  difficulty_level,
  quiz_sub_type_id,
  created_at,
  updated_at
) VALUES (
  201, -- Example Quiz ID
  'Fundamentals of Sentiment Analysis',
  'Intermediate',
  (SELECT id FROM public.quiz_sub_types WHERE name = 'nlp-solutions'), -- FK to quiz_sub_types
  NOW(),
  NOW()
);

-- Insert Questions for the 'nlp-solutions' Quiz (ID: 201)
INSERT INTO public.questions (
  id,
  quiz_tag,
  question_text,
  correct_answer,
  explanation,
  quiz_sub_type_id,
  created_at,
  updated_at
) VALUES (
  2001, -- Example Question ID
  201,  -- Links to the quiz with ID 201
  'What does sentiment analysis aim to determine?',
  'The emotional tone or opinion expressed in a piece of text.',
  'It identifies if text is positive, negative, or neutral.',
  (SELECT id FROM public.quiz_sub_types WHERE name = 'nlp-solutions'), -- FK to quiz_sub_types
  NOW(),
  NOW()
),
(
  2002, -- Example Question ID
  201,  -- Links to the quiz with ID 201
  'What is a common challenge in sentiment analysis?',
  'Detecting sarcasm and irony.',
  'Figurative language can often mislead sentiment classifiers.',
  (SELECT id FROM public.quiz_sub_types WHERE name = 'nlp-solutions'), -- FK to quiz_sub_types
  NOW(),
  NOW()
);

*/

-- Reminder: Query available sub-types if you are unsure of the IDs:
-- SELECT id, name FROM public.quiz_sub_types ORDER BY name;

COMMENT ON SCHEMA public IS 'Contains template SQL for seeding sample quizzes and questions linked to their respective sub-types. Uncomment and modify to use.';

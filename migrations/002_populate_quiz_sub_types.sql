-- Populate quiz_sub_types with initial data
INSERT INTO public.quiz_sub_types (name) VALUES
('computer-vision'),
('knowledge-mining'),
('nlp-solutions'),
('solution-planning')
ON CONFLICT (name) DO NOTHING; -- Avoids error if script is run multiple times

COMMENT ON TABLE public.quiz_sub_types IS 'Stores the different sub-types or categories for quizzes. This script populates initial values.';

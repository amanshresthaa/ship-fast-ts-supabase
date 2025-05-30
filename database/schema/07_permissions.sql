-- Row Level Security Policies and Permissions
-- This file contains all RLS policies and database permissions

-- ------------------------------------------------------------------
-- TABLE PERMISSIONS
-- ------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
  TO anon, authenticated, service_role;

-- ------------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY
-- ------------------------------------------------------------------
ALTER TABLE public.user_quiz_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adaptive_quiz_sessions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------
-- USER QUIZ PROGRESS RLS POLICIES
-- ------------------------------------------------------------------
CREATE POLICY "Users can view their own progress"
  ON public.user_quiz_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.user_quiz_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.user_quiz_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON public.user_quiz_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------
-- QUESTION RESPONSES RLS POLICIES
-- ------------------------------------------------------------------
CREATE POLICY "Users can view their own responses"
  ON public.question_responses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses"
  ON public.question_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
  ON public.question_responses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own responses"
  ON public.question_responses
  FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------
-- USER QUESTION PERFORMANCE RLS POLICIES
-- ------------------------------------------------------------------
CREATE POLICY "Users can view their own performance"
  ON public.user_question_performance
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance"
  ON public.user_question_performance
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own performance"
  ON public.user_question_performance
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own performance"
  ON public.user_question_performance
  FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------
-- ADAPTIVE QUIZ SESSIONS RLS POLICIES
-- ------------------------------------------------------------------
CREATE POLICY "Users can view their own sessions"
  ON public.adaptive_quiz_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.adaptive_quiz_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.adaptive_quiz_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.adaptive_quiz_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

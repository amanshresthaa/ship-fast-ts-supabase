-- Database Triggers
-- This file contains all database triggers for automated functionality

-- ------------------------------------------------------------------
-- TIMESTAMP TRIGGERS
-- ------------------------------------------------------------------
-- Add trigger for updated_at on quizzes
DROP TRIGGER IF EXISTS set_timestamp_quizzes ON public.quizzes;
CREATE TRIGGER set_timestamp_quizzes
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Add trigger for updated_at on questions
DROP TRIGGER IF EXISTS set_timestamp_questions ON public.questions;
CREATE TRIGGER set_timestamp_questions
BEFORE UPDATE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Add trigger for updated_at on user_quiz_progress
DROP TRIGGER IF EXISTS set_timestamp_user_quiz_progress ON public.user_quiz_progress;
CREATE TRIGGER set_timestamp_user_quiz_progress
BEFORE UPDATE ON public.user_quiz_progress
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Add trigger for updated_at on question_responses
DROP TRIGGER IF EXISTS set_timestamp_question_responses ON public.question_responses;
CREATE TRIGGER set_timestamp_question_responses
BEFORE UPDATE ON public.question_responses
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Add trigger for updated_at on user_question_performance
DROP TRIGGER IF EXISTS set_timestamp_user_question_performance ON public.user_question_performance;
CREATE TRIGGER set_timestamp_user_question_performance
BEFORE UPDATE ON public.user_question_performance
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Add trigger for updated_at on adaptive_quiz_sessions
DROP TRIGGER IF EXISTS set_timestamp_adaptive_quiz_sessions ON public.adaptive_quiz_sessions;
CREATE TRIGGER set_timestamp_adaptive_quiz_sessions
BEFORE UPDATE ON public.adaptive_quiz_sessions
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ------------------------------------------------------------------
-- SPACED REPETITION PERFORMANCE TRACKING TRIGGER
-- ------------------------------------------------------------------
-- Function to update user question performance when a response is submitted
CREATE OR REPLACE FUNCTION fn_update_user_question_performance()
RETURNS TRIGGER AS $$
DECLARE
  quality_rating INTEGER;
  sm2_result RECORD;
  current_perf RECORD;
  new_priority_score DECIMAL;
  avg_time INTEGER;
BEGIN
  -- Determine quality rating from response (simplified logic)
  -- This can be enhanced based on response_time_ms and confidence_level
  IF NEW.is_correct THEN
    -- Correct answer: base quality 4, can be adjusted by response time
    quality_rating := 4;
    IF NEW.response_time_ms <= 5000 THEN -- Fast response (5 seconds or less)
      quality_rating := 5;
    ELSIF NEW.response_time_ms > 20000 THEN -- Slow response (20+ seconds)
      quality_rating := 3;
    END IF;
  ELSE
    -- Incorrect answer: base quality 1, can be slightly adjusted
    quality_rating := 1;
    IF NEW.confidence_level IS NOT NULL AND NEW.confidence_level <= 2 THEN
      quality_rating := 2; -- At least they knew they were unsure
    END IF;
  END IF;
  
  -- Get current performance or initialize defaults
  SELECT * INTO current_perf
  FROM public.user_question_performance uqp
  WHERE uqp.user_id = NEW.user_id AND uqp.question_id = NEW.question_id;
  
  -- Calculate new SM-2 parameters
  SELECT * INTO sm2_result
  FROM calculate_next_review_date(NEW.user_id, NEW.question_id, quality_rating);
  
  -- Calculate new average response time
  IF current_perf IS NOT NULL THEN
    avg_time := ROUND((COALESCE(current_perf.avg_response_time_ms, 0) * current_perf.total_attempts + NEW.response_time_ms) / (current_perf.total_attempts + 1));
  ELSE
    avg_time := NEW.response_time_ms;
  END IF;
  
  -- Calculate priority score (higher = more important to review)
  -- Base on incorrect streak, time since last review, and ease factor
  new_priority_score := 0.0;
  IF current_perf IS NOT NULL THEN
    new_priority_score := current_perf.incorrect_streak * 10.0; -- Heavy weight on incorrect streaks
    IF NOT NEW.is_correct THEN
      new_priority_score := new_priority_score + 5.0; -- Boost for recent incorrect
    END IF;
    new_priority_score := new_priority_score + (3.0 - sm2_result.ease_factor); -- Lower ease = higher priority
  ELSE
    IF NOT NEW.is_correct THEN
      new_priority_score := 15.0; -- High priority for first incorrect attempt
    ELSE
      new_priority_score := 1.0; -- Low priority for first correct attempt
    END IF;
  END IF;
  
  -- Upsert user_question_performance record
  INSERT INTO public.user_question_performance (
    user_id,
    question_id,
    ease_factor,
    interval_days,
    repetitions,
    next_review_date,
    correct_streak,
    incorrect_streak,
    total_attempts,
    correct_attempts,
    avg_response_time_ms,
    priority_score,
    last_reviewed_at
  ) VALUES (
    NEW.user_id,
    NEW.question_id,
    sm2_result.ease_factor,
    sm2_result.interval_days,
    sm2_result.repetitions,
    sm2_result.next_review_date,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    CASE WHEN NEW.is_correct THEN 0 ELSE 1 END,
    1,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    avg_time,
    new_priority_score,
    NEW.submitted_at
  )
  ON CONFLICT (user_id, question_id) DO UPDATE SET
    ease_factor = sm2_result.ease_factor,
    interval_days = sm2_result.interval_days,
    repetitions = sm2_result.repetitions,
    next_review_date = sm2_result.next_review_date,
    correct_streak = CASE 
      WHEN NEW.is_correct THEN user_question_performance.correct_streak + 1 
      ELSE 0 
    END,
    incorrect_streak = CASE 
      WHEN NEW.is_correct THEN 0 
      ELSE user_question_performance.incorrect_streak + 1 
    END,
    total_attempts = user_question_performance.total_attempts + 1,
    correct_attempts = user_question_performance.correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    avg_response_time_ms = avg_time,
    priority_score = new_priority_score,
    last_reviewed_at = NEW.submitted_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on question_responses to automatically update performance
DROP TRIGGER IF EXISTS trigger_update_user_question_performance ON public.question_responses;
CREATE TRIGGER trigger_update_user_question_performance
  AFTER INSERT ON public.question_responses
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_user_question_performance();

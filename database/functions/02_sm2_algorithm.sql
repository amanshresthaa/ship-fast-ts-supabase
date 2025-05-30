-- SM-2 Algorithm Functions for Spaced Repetition
-- This file contains the core SM-2 algorithm implementation

-- ------------------------------------------------------------------
-- CORE SM-2 ALGORITHM FUNCTION
-- ------------------------------------------------------------------
-- Core SM-2 algorithm function that calculates spaced repetition parameters
CREATE OR REPLACE FUNCTION fn_calculate_sm2_review_details(
  current_ease_factor DECIMAL DEFAULT 2.5,
  current_interval INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  quality_rating INTEGER DEFAULT 3
)
RETURNS TABLE (
  new_ease_factor DECIMAL,
  new_interval_days INTEGER,
  new_repetitions INTEGER,
  next_review_date TIMESTAMPTZ
) AS $$
DECLARE
  ef DECIMAL;
  interval_days INTEGER;
  reps INTEGER;
BEGIN
  -- Validate input parameters
  IF quality_rating < 0 OR quality_rating > 5 THEN
    RAISE EXCEPTION 'Quality rating must be between 0 and 5, got %', quality_rating;
  END IF;
  
  IF current_ease_factor < 1.3 THEN
    current_ease_factor := 1.3;
  END IF;
  
  -- SM-2 Algorithm Implementation
  reps := repetitions;
  
  -- If quality is less than 3, reset repetitions and set interval to 1
  IF quality_rating < 3 THEN
    reps := 0;
    interval_days := 1;
  ELSE
    reps := repetitions + 1;
    
    -- Calculate interval based on repetitions
    IF reps = 1 THEN
      interval_days := 1;
    ELSIF reps = 2 THEN
      interval_days := 6;
    ELSE
      interval_days := ROUND(current_interval * current_ease_factor);
    END IF;
  END IF;
  
  -- Calculate new ease factor using SM-2 formula
  -- EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  ef := current_ease_factor + (0.1 - (5 - quality_rating) * (0.08 + (5 - quality_rating) * 0.02));
  
  -- Ensure ease factor stays within reasonable bounds
  IF ef < 1.3 THEN
    ef := 1.3;
  ELSIF ef > 2.5 THEN
    ef := 2.5;
  END IF;
  
  -- Ensure minimum interval
  IF interval_days < 1 THEN
    interval_days := 1;
  END IF;
  
  RETURN QUERY SELECT 
    ef,
    interval_days,
    reps,
    (NOW() + INTERVAL '1 day' * interval_days)::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------
-- SM-2 WRAPPER FUNCTION
-- ------------------------------------------------------------------
-- Wrapper function for easier SM-2 calculations with simplified interface
CREATE OR REPLACE FUNCTION calculate_next_review_date(
  p_user_id UUID,
  p_question_id UUID,
  p_quality_rating INTEGER
)
RETURNS TABLE (
  ease_factor DECIMAL,
  interval_days INTEGER,
  repetitions INTEGER,
  next_review_date TIMESTAMPTZ
) AS $$
DECLARE
  current_performance RECORD;
  sm2_result RECORD;
BEGIN
  -- Get current performance data or use defaults for new questions
  SELECT 
    COALESCE(uqp.ease_factor, 2.5) as current_ease_factor,
    COALESCE(uqp.interval_days, 1) as current_interval,
    COALESCE(uqp.repetitions, 0) as current_repetitions
  INTO current_performance
  FROM public.user_question_performance uqp
  WHERE uqp.user_id = p_user_id AND uqp.question_id = p_question_id;
  
  -- If no existing performance record, use defaults
  IF current_performance IS NULL THEN
    current_performance := ROW(2.5, 1, 0);
  END IF;
  
  -- Calculate new SM-2 parameters
  SELECT * INTO sm2_result
  FROM fn_calculate_sm2_review_details(
    current_performance.current_ease_factor,
    current_performance.current_interval,
    current_performance.current_repetitions,
    p_quality_rating
  );
  
  RETURN QUERY SELECT 
    sm2_result.new_ease_factor,
    sm2_result.new_interval_days,
    sm2_result.new_repetitions,
    sm2_result.next_review_date;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------
-- REVIEW QUESTION RETRIEVAL FUNCTION
-- ------------------------------------------------------------------
-- Function to get questions due for review for a specific user
CREATE OR REPLACE FUNCTION get_questions_due_for_review(
  p_user_id UUID,
  p_quiz_topic_filter TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  question_id UUID,
  question_text TEXT,
  question_type question_type,
  quiz_topic TEXT,
  difficulty difficulty,
  points INTEGER,
  next_review_date TIMESTAMPTZ,
  ease_factor DECIMAL,
  interval_days INTEGER,
  repetitions INTEGER,
  correct_streak INTEGER,
  incorrect_streak INTEGER,
  priority_score DECIMAL,
  total_attempts INTEGER,
  correct_attempts INTEGER,
  last_reviewed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH questions_with_performance AS (
    -- Get all questions with their performance data (if any)
    SELECT 
      q.id as question_id,
      q.question as question_text,
      q.type as question_type,
      q.quiz_topic,
      q.difficulty,
      q.points,
      COALESCE(uqp.next_review_date, NOW()) as next_review_date,
      COALESCE(uqp.ease_factor, 2.5) as ease_factor,
      COALESCE(uqp.interval_days, 1) as interval_days,
      COALESCE(uqp.repetitions, 0) as repetitions,
      COALESCE(uqp.correct_streak, 0) as correct_streak,
      COALESCE(uqp.incorrect_streak, 0) as incorrect_streak,
      COALESCE(uqp.priority_score, 
        -- Default priority for never-attempted questions
        CASE 
          WHEN q.difficulty = 'hard' THEN 5.0
          WHEN q.difficulty = 'medium' THEN 3.0
          ELSE 1.0
        END
      ) as priority_score,
      COALESCE(uqp.total_attempts, 0) as total_attempts,
      COALESCE(uqp.correct_attempts, 0) as correct_attempts,
      uqp.last_reviewed_at
    FROM public.questions q
    LEFT JOIN public.user_question_performance uqp 
      ON q.id = uqp.question_id AND uqp.user_id = p_user_id
    WHERE 
      -- Filter by quiz topic if specified
      (p_quiz_topic_filter IS NULL OR q.quiz_topic = p_quiz_topic_filter)
  ),
  due_questions AS (
    SELECT *
    FROM questions_with_performance
    WHERE 
      -- Question is due for review (either never reviewed or past due date)
      next_review_date <= NOW()
      -- Include questions that have never been attempted
      OR total_attempts = 0
  )
  SELECT 
    dq.question_id,
    dq.question_text,
    dq.question_type,
    dq.quiz_topic,
    dq.difficulty,
    dq.points,
    dq.next_review_date,
    dq.ease_factor,
    dq.interval_days,
    dq.repetitions,
    dq.correct_streak,
    dq.incorrect_streak,
    dq.priority_score,
    dq.total_attempts,
    dq.correct_attempts,
    dq.last_reviewed_at
  FROM due_questions dq
  ORDER BY 
    -- Prioritize by priority score (high = urgent), then by next review date (oldest first)
    dq.priority_score DESC,
    dq.next_review_date ASC,
    -- Tie-breaker: questions never attempted come first
    CASE WHEN dq.total_attempts = 0 THEN 0 ELSE 1 END,
    -- Final tie-breaker: difficulty (hard first)
    CASE 
      WHEN dq.difficulty = 'hard' THEN 0
      WHEN dq.difficulty = 'medium' THEN 1
      ELSE 2
    END
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

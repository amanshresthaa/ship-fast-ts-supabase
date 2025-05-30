-- Analytics and Statistics Functions
-- This file contains functions for analytics and user progress reporting

-- ------------------------------------------------------------------
-- USER SPACED REPETITION STATISTICS
-- ------------------------------------------------------------------
-- Function to get spaced repetition statistics for a user
CREATE OR REPLACE FUNCTION get_user_spaced_repetition_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_total_questions_reviewed INTEGER;
    v_questions_due_today INTEGER;
    v_questions_due_this_week INTEGER;
    v_average_ease_factor NUMERIC(4,2);
    v_accuracy_rate NUMERIC(5,2);
    v_mastered_questions INTEGER;
    v_struggling_questions INTEGER;
    v_total_response_time BIGINT;
    v_total_responses INTEGER;
    v_avg_response_time_seconds NUMERIC(6,2);
    v_longest_streak INTEGER;
    v_current_streak INTEGER;
    v_questions_studied_today INTEGER;
    v_total_study_time_minutes INTEGER;
    v_result JSON;
BEGIN
    -- Total questions reviewed (with at least one attempt)
    SELECT COUNT(*)
    INTO v_total_questions_reviewed
    FROM user_question_performance uqp
    WHERE uqp.user_id = p_user_id 
    AND uqp.total_attempts > 0;

    -- Questions due today
    SELECT COUNT(*)
    INTO v_questions_due_today
    FROM user_question_performance uqp
    WHERE uqp.user_id = p_user_id
    AND uqp.next_review_date <= CURRENT_DATE + INTERVAL '1 day'
    AND uqp.next_review_date >= CURRENT_DATE;

    -- Questions due this week (next 7 days)
    SELECT COUNT(*)
    INTO v_questions_due_this_week
    FROM user_question_performance uqp
    WHERE uqp.user_id = p_user_id
    AND uqp.next_review_date <= CURRENT_DATE + INTERVAL '7 days'
    AND uqp.next_review_date >= CURRENT_DATE;

    -- Average ease factor
    SELECT COALESCE(AVG(uqp.ease_factor), 2.5)
    INTO v_average_ease_factor
    FROM user_question_performance uqp
    WHERE uqp.user_id = p_user_id
    AND uqp.total_attempts > 0;

    -- Accuracy rate (percentage of correct responses)
    SELECT COALESCE(
        CASE 
            WHEN SUM(uqp.total_attempts) > 0 
            THEN ROUND((SUM(uqp.correct_attempts)::NUMERIC / SUM(uqp.total_attempts)) * 100, 2)
            ELSE 0
        END, 0
    )
    INTO v_accuracy_rate
    FROM user_question_performance uqp
    WHERE uqp.user_id = p_user_id;

    -- Mastered questions (ease_factor > 2.3 AND interval_days > 30)
    SELECT COUNT(*)
    INTO v_mastered_questions
    FROM user_question_performance uqp
    WHERE uqp.user_id = p_user_id
    AND uqp.ease_factor > 2.3
    AND uqp.interval_days > 30
    AND uqp.total_attempts > 0;

    -- Struggling questions (incorrect_streak >= 2 OR ease_factor < 1.5)
    SELECT COUNT(*)
    INTO v_struggling_questions
    FROM user_question_performance uqp
    WHERE uqp.user_id = p_user_id
    AND (uqp.incorrect_streak >= 2 OR uqp.ease_factor < 1.5)
    AND uqp.total_attempts > 0;

    -- Average response time and total study metrics
    SELECT 
        COALESCE(SUM(qr.response_time_ms), 0),
        COUNT(*),
        COALESCE(MAX(uqp.correct_streak), 0)
    INTO v_total_response_time, v_total_responses, v_longest_streak
    FROM question_responses qr
    JOIN user_question_performance uqp ON qr.user_id = uqp.user_id AND qr.question_id = uqp.question_id
    WHERE qr.user_id = p_user_id;

    -- Calculate average response time in seconds
    v_avg_response_time_seconds := CASE 
        WHEN v_total_responses > 0 
        THEN ROUND((v_total_response_time::NUMERIC / v_total_responses) / 1000, 2)
        ELSE 0 
    END;

    -- Current streak (longest current correct streak across all questions)
    SELECT COALESCE(MAX(uqp.correct_streak), 0)
    INTO v_current_streak
    FROM user_question_performance uqp
    WHERE uqp.user_id = p_user_id;

    -- Questions studied today
    SELECT COUNT(DISTINCT qr.question_id)
    INTO v_questions_studied_today
    FROM question_responses qr
    WHERE qr.user_id = p_user_id
    AND qr.submitted_at >= CURRENT_DATE
    AND qr.submitted_at < CURRENT_DATE + INTERVAL '1 day';

    -- Total study time today (in minutes)
    SELECT COALESCE(ROUND(SUM(qr.response_time_ms)::NUMERIC / (1000 * 60)), 0)
    INTO v_total_study_time_minutes
    FROM question_responses qr
    WHERE qr.user_id = p_user_id
    AND qr.submitted_at >= CURRENT_DATE
    AND qr.submitted_at < CURRENT_DATE + INTERVAL '1 day';

    -- Build result JSON
    v_result := json_build_object(
        'totalQuestionsReviewed', v_total_questions_reviewed,
        'questionsDueToday', v_questions_due_today,
        'questionsDueThisWeek', v_questions_due_this_week,
        'averageEaseFactor', v_average_ease_factor,
        'accuracyRate', v_accuracy_rate,
        'masteredQuestions', v_mastered_questions,
        'strugglingQuestions', v_struggling_questions,
        'averageResponseTimeSeconds', v_avg_response_time_seconds,
        'longestStreak', v_longest_streak,
        'currentStreak', v_current_streak,
        'questionsStudiedToday', v_questions_studied_today,
        'totalStudyTimeMinutesToday', v_total_study_time_minutes,
        'calculatedAt', EXTRACT(EPOCH FROM NOW())::BIGINT
    );

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        -- Return error information in case of failure
        RETURN json_build_object(
            'error', true,
            'message', SQLERRM,
            'calculatedAt', EXTRACT(EPOCH FROM NOW())::BIGINT
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

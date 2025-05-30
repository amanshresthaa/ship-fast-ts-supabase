import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface QuestionResponseBody {
  question_id: string;
  quiz_session_id?: string;
  user_answer_data: any;
  is_correct: boolean;
  response_time_ms: number;
  confidence_level?: number;
}

/**
 * POST /api/quiz/response
 * Records a user's response to a question and triggers spaced repetition updates
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const body: QuestionResponseBody = await request.json();
    
    // Validate required fields
    if (!body.question_id || typeof body.is_correct !== 'boolean' || !body.response_time_ms) {
      return NextResponse.json(
        { error: 'Missing required fields: question_id, is_correct, response_time_ms' },
        { status: 400 }
      );
    }

    // Validate response_time_ms is positive
    if (body.response_time_ms < 0) {
      return NextResponse.json(
        { error: 'response_time_ms must be non-negative' },
        { status: 400 }
      );
    }

    // Validate confidence_level if provided
    if (body.confidence_level !== undefined && (body.confidence_level < 1 || body.confidence_level > 5)) {
      return NextResponse.json(
        { error: 'confidence_level must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify question exists
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id')
      .eq('id', body.question_id)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Insert question response (this will trigger the performance update via database trigger)
    const { data: response, error: insertError } = await supabase
      .from('question_responses')
      .insert({
        user_id: session.user.id,
        question_id: body.question_id,
        quiz_session_id: body.quiz_session_id || null,
        user_answer_data: body.user_answer_data,
        is_correct: body.is_correct,
        response_time_ms: body.response_time_ms,
        confidence_level: body.confidence_level || null,
      })
      .select('id, submitted_at')
      .single();

    if (insertError) {
      console.error('Error inserting question response:', insertError);
      return NextResponse.json(
        { error: 'Failed to record response' },
        { status: 500 }
      );
    }

    // Get updated performance data to return to client
    const { data: performance } = await supabase
      .from('user_question_performance')
      .select('next_review_date, ease_factor, interval_days, repetitions, correct_streak, incorrect_streak, priority_score')
      .eq('user_id', session.user.id)
      .eq('question_id', body.question_id)
      .single();

    return NextResponse.json({
      success: true,
      response_id: response.id,
      submitted_at: response.submitted_at,
      performance: performance || null,
      message: 'Response recorded successfully'
    });

  } catch (error) {
    console.error('Unexpected error in quiz response endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

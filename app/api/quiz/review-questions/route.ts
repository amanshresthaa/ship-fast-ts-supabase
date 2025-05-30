import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface ReviewQuestionsQuery {
  quiz_topic?: string;
  limit?: string;
}

/**
 * GET /api/quiz/review-questions
 * Retrieves questions that are due for review for the authenticated user
 * Query parameters:
 * - quiz_topic (optional): Filter by specific quiz topic
 * - limit (optional): Maximum number of questions to return (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const quiz_topic = searchParams.get('quiz_topic') || undefined;
    const limitParam = searchParams.get('limit');
    
    // Validate and set limit
    let limit = 20; // default
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json(
          { error: 'limit must be a positive integer' },
          { status: 400 }
        );
      }
      if (parsedLimit > 100) {
        return NextResponse.json(
          { error: 'limit cannot exceed 100' },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    // Call the database function to get questions due for review
    const { data: questions, error: questionsError } = await supabase
      .rpc('get_questions_due_for_review', {
        p_user_id: session.user.id,
        p_quiz_topic_filter: quiz_topic || null,
        p_limit: limit
      });

    if (questionsError) {
      console.error('Error fetching review questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch review questions' },
        { status: 500 }
      );
    }

    // Transform the response to include metadata
    const response = {
      success: true,
      questions: questions || [],
      metadata: {
        total_count: questions?.length || 0,
        quiz_topic_filter: quiz_topic || null,
        limit: limit,
        generated_at: new Date().toISOString()
      }
    };

    // Add caching headers (cache for 1 minute to balance freshness with performance)
    const headers = new Headers();
    headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');
    
    return NextResponse.json(response, { headers });

  } catch (error) {
    console.error('Unexpected error in review questions endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quiz/review-questions
 * Alternative endpoint for getting review questions with more complex filtering
 * Accepts JSON body with filtering options
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

    const body = await request.json();
    const { quiz_topic, limit = 20, include_metadata = true } = body;

    // Validate limit
    if (typeof limit !== 'number' || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit must be a number between 1 and 100' },
        { status: 400 }
      );
    }

    // Call the database function
    const { data: questions, error: questionsError } = await supabase
      .rpc('get_questions_due_for_review', {
        p_user_id: session.user.id,
        p_quiz_topic_filter: quiz_topic || null,
        p_limit: limit
      });

    if (questionsError) {
      console.error('Error fetching review questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch review questions' },
        { status: 500 }
      );
    }

    const response: any = {
      success: true,
      questions: questions || []
    };

    if (include_metadata) {
      response.metadata = {
        total_count: questions?.length || 0,
        quiz_topic_filter: quiz_topic || null,
        limit: limit,
        generated_at: new Date().toISOString(),
        user_id: session.user.id
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in review questions POST endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

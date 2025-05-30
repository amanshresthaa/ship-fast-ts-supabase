import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { createSpacedRepetitionService } from '../../../../libs/spaced-repetition';

const adaptiveSessionSchema = z.object({
  quiz_topic: z.string().min(1, { message: 'Quiz topic is required.' }),
  question_ids: z
    .array(z.string().uuid({ message: 'Each question ID must be a valid UUID.' }))
    .min(1, { message: 'At least one question ID is required.' })
    .max(50, { message: 'Cannot select more than 50 questions.' }),
  session_settings: z.record(z.any()).optional().default({}),
});

/**
 * POST /api/quiz/adaptive-session
 * Creates a new adaptive quiz session for the authenticated user
 */
export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const spacedRepetitionService = createSpacedRepetitionService(supabase);

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reqBody = await request.json();
    const validationResult = adaptiveSessionSchema.safeParse(reqBody);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { quiz_topic, question_ids, session_settings } = validationResult.data;

    const { session: newSession, error: serviceError } = await spacedRepetitionService.createAdaptiveQuizSession({
      user_id: user.id,
      quiz_topic,
      question_ids,
      session_settings,
    });

    if (serviceError || !newSession) {
      console.error('Error creating adaptive quiz session via service:', serviceError);
      return NextResponse.json(
        { error: 'Failed to create adaptive quiz session', details: serviceError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Adaptive quiz session created successfully',
      session: {
        session_id: newSession.session_id,
        quiz_topic: newSession.quiz_topic,
        question_count: newSession.question_ids.length,
        created_at: newSession.created_at,
        session_settings: newSession.session_settings
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error in POST /api/quiz/adaptive-session:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body format', details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

/**
 * GET /api/quiz/adaptive-session
 * Retrieves adaptive quiz sessions for the authenticated user
 * Query parameters:
 * - session_id: Get a specific session
 * - quiz_topic: Filter by quiz topic
 * - completed: Filter by completion status (true/false)
 * - limit: Maximum number of sessions to return (default: 10, max: 50)
 * - offset: Number of sessions to skip for pagination
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
    const sessionId = searchParams.get('session_id');
    const quizTopic = searchParams.get('quiz_topic') || undefined;
    const completedParam = searchParams.get('completed');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Create the service instance
    const spacedRepetitionService = createSpacedRepetitionService(supabase);

    // If session_id is provided, get that specific session
    if (sessionId) {
      const { session: quizSession, error: serviceError } = await spacedRepetitionService.getAdaptiveQuizSession(
        sessionId,
        session.user.id
      );

      if (serviceError) {
        return NextResponse.json(
          { error: serviceError },
          { status: serviceError === 'Session not found' ? 404 : 500 }
        );
      }

      return NextResponse.json({
        success: true,
        session: quizSession
      });
    }

    // Otherwise, get sessions with filtering
    let completed: boolean | undefined;
    if (completedParam === 'true') completed = true;
    else if (completedParam === 'false') completed = false;

    let limit = 10; // default
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
        return NextResponse.json(
          { error: 'limit must be a number between 1 and 50' },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    let offset = 0;
    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam, 10);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return NextResponse.json(
          { error: 'offset must be a non-negative number' },
          { status: 400 }
        );
      }
      offset = parsedOffset;
    }

    const { sessions, error: serviceError } = await spacedRepetitionService.getUserAdaptiveQuizSessions(
      session.user.id,
      {
        quiz_topic: quizTopic,
        completed,
        limit,
        offset
      }
    );

    if (serviceError) {
      return NextResponse.json(
        { error: serviceError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessions,
      metadata: {
        total_count: sessions.length,
        quiz_topic_filter: quizTopic || null,
        completed_filter: completed,
        limit,
        offset
      }
    });

  } catch (error) {
    console.error('Unexpected error in adaptive session GET endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/quiz/adaptive-session
 * Updates an adaptive quiz session (e.g., mark as completed)
 */
export async function PATCH(request: NextRequest) {
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
    const { session_id, action } = body;

    if (!session_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, action' },
        { status: 400 }
      );
    }

    // Create the service instance
    const spacedRepetitionService = createSpacedRepetitionService(supabase);

    if (action === 'complete') {
      const { success, error: serviceError } = await spacedRepetitionService.completeAdaptiveQuizSession(
        session_id,
        session.user.id
      );

      if (!success) {
        return NextResponse.json(
          { error: serviceError || 'Failed to complete session' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Session marked as completed'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: complete' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Unexpected error in adaptive session PATCH endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

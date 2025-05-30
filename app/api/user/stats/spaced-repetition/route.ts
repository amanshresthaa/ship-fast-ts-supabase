import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/user/stats/spaced-repetition
// Returns comprehensive spaced repetition statistics for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Call the analytics function
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_user_spaced_repetition_stats', {
        p_user_id: user.id
      });

    if (statsError) {
      console.error('Database error fetching stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch user statistics' },
        { status: 500 }
      );
    }

    // Check if the function returned an error
    if (statsData && typeof statsData === 'object' && statsData.error) {
      console.error('Function error:', statsData.message);
      return NextResponse.json(
        { error: 'Failed to calculate statistics', details: statsData.message },
        { status: 500 }
      );
    }

    // Return the statistics
    return NextResponse.json({
      success: true,
      data: statsData || {
        totalQuestionsReviewed: 0,
        questionsDueToday: 0,
        questionsDueThisWeek: 0,
        averageEaseFactor: 2.5,
        accuracyRate: 0,
        masteredQuestions: 0,
        strugglingQuestions: 0,
        averageResponseTimeSeconds: 0,
        longestStreak: 0,
        currentStreak: 0,
        questionsStudiedToday: 0,
        totalStudyTimeMinutesToday: 0,
        calculatedAt: Math.floor(Date.now() / 1000)
      }
    });

  } catch (error) {
    console.error('Unexpected error in spaced repetition stats endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS support
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

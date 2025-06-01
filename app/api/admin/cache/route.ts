import { NextRequest, NextResponse } from 'next/server';
import { clearQuizCache, getQuizCacheStats } from '../../../lib/supabaseQuizServiceRedis';

// Make sure the page is never cached by browsers
export const dynamic = 'force-dynamic';

/**
 * Handles GET requests to retrieve quiz cache statistics for admin purposes.
 *
 * Requires a valid Bearer token in the Authorization header if an admin API key is configured.
 *
 * @returns A JSON response containing quiz cache statistics, or an error message with appropriate HTTP status code.
 */
export async function GET(request: NextRequest) {
  try {
    // Basic API key authentication
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.ADMIN_API_KEY;
    
    // Validate API key if set
    if (apiKey && (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get cache statistics
    const stats = await getQuizCacheStats();
    
    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Error getting cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to get cache statistics', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handles DELETE requests to clear quiz cache, either globally or for a specific quiz.
 *
 * Requires a valid admin API key in the Authorization header if {@link process.env.ADMIN_API_KEY} is set.
 * If a `quizId` query parameter is provided, clears the cache for that quiz; otherwise, clears all quiz cache.
 *
 * @returns A JSON response indicating success and which cache was cleared, or an error response on failure.
 */
export async function DELETE(request: NextRequest) {
  try {
    // Basic API key authentication
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.ADMIN_API_KEY;
    
    // Validate API key if set
    if (apiKey && (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the quiz ID from query parameters if present
    const searchParams = request.nextUrl.searchParams;
    const quizId = searchParams.get('quizId');
    
    // Clear specific quiz cache or all cache
    await clearQuizCache(quizId || undefined);
    
    return NextResponse.json({
      success: true,
      message: quizId 
        ? `Cache cleared for quiz ${quizId}` 
        : 'All quiz cache cleared'
    });
  } catch (error: any) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handles POST requests to force-refresh the cache for a specific quiz.
 *
 * Authenticates the request using a Bearer token if an admin API key is set. Expects a JSON body containing a `quizId`. Clears the cache for the specified quiz, then re-fetches and updates the cache with the latest quiz data. Returns a JSON response indicating success and the number of questions in the quiz, or an error response if the quiz is not found or another error occurs.
 *
 * @remark Returns a 401 response if authentication fails, 400 if `quizId` is missing, 404 if the quiz does not exist, and 500 for other errors.
 */
export async function POST(request: NextRequest) {
  try {
    // Basic API key authentication
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.ADMIN_API_KEY;
    
    // Validate API key if set
    if (apiKey && (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const body = await request.json();
    const { quizId } = body;
    
    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }
    
    // Clear the cache for this specific quiz
    await clearQuizCache(quizId);
    
    // Import the quiz fetching function to reload the data
    const { fetchQuizById } = await import('../../../lib/supabaseQuizServiceRedis');
    
    // Force fresh fetch with caching enabled to update the cache
    const quiz = await fetchQuizById(quizId, undefined, true);
    
    if (!quiz) {
      return NextResponse.json(
        { error: `Quiz ${quizId} not found` },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Cache refreshed for quiz ${quizId}`,
      questionCount: quiz.questions.length
    });
  } catch (error: any) {
    console.error('Error refreshing cache:', error);
    return NextResponse.json(
      { error: 'Failed to refresh cache', details: error.message },
      { status: 500 }
    );
  }
}

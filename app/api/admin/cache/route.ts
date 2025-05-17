import { NextRequest, NextResponse } from 'next/server';
import { clearQuizCache, getQuizCacheStats } from '../../../lib/supabaseQuizServiceRedis';

// Make sure the page is never cached by browsers
export const dynamic = 'force-dynamic';

// Get cache statistics
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

// Clear cache (DELETE method)
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

// Force refresh specific quiz (POST method)
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

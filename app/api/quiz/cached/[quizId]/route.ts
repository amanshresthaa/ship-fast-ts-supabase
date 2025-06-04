import { NextRequest, NextResponse } from 'next/server';
import { fetchQuizByIdOptimized } from '../../../../lib/supabaseQuizServiceOptimized';

// Set the revalidation period (in seconds)
export const revalidate = 3600; // Revalidate cache every hour

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params;
  
  // Get optional questionType from search params
  const searchParams = request.nextUrl.searchParams;
  const questionType = searchParams.get('type') || undefined;
  
  try {
    // Use the optimized quiz service with caching
    const quiz = await fetchQuizByIdOptimized(quizId, questionType);
    
    if (!quiz) {
      return NextResponse.json(
        { error: `Quiz ${quizId} not found` },
        { status: 404 }
      );
    }
    
    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error(`Error fetching quiz ${quizId}:`, error);
    
    return NextResponse.json(
      { error: 'Error fetching quiz data', details: error.message },
      { status: 500 }
    );
  }
}

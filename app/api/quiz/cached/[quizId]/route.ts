import { NextRequest, NextResponse } from 'next/server';
import { fetchQuizByIdOptimized } from '../../../../lib/supabaseQuizServiceOptimized';

// Set the revalidation period (in seconds)
export const revalidate = 3600; /**
 * Handles GET requests to retrieve quiz data by ID, with optional filtering by question type.
 *
 * Returns the quiz data as JSON if found, or a 404 JSON response if the quiz does not exist.
 * If an error occurs during fetching, returns a 500 JSON response with error details.
 *
 * @param request - The incoming Next.js request object.
 * @param params - Route parameters containing the quiz ID.
 * @returns A JSON response with the quiz data, or an error message with the appropriate HTTP status code.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  const { quizId } = params;
  
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

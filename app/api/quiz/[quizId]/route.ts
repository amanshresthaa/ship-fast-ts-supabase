import { NextResponse } from 'next/server';
import { fetchQuizById } from '../../../lib/supabaseQuizService'; /**
 * Handles GET requests to retrieve quiz data by ID, with optional filtering by question types.
 *
 * Extracts the quiz ID from route parameters and supports filtering quiz questions by type using the `questionType` or `types` query parameters. Returns the quiz data as JSON, or an error response if the quiz is not found or an error occurs.
 *
 * @param request - The incoming HTTP request.
 * @param params - Route parameters containing the quiz ID.
 * @returns A JSON response with the quiz data, or an error message with the appropriate HTTP status code.
 */

export async function GET(
  request: Request,
  { params }: { params: { quizId: string } }
) {
  // Need to properly handle params in Next.js 13+
  const quizId = (await Promise.resolve(params)).quizId;
  
  // Extract questionType and types from URL
  const url = new URL(request.url);
  const questionType = url.searchParams.get('questionType');
  const typesParam = url.searchParams.get('types');
  
  // Handle both single questionType and multiple types
  let questionTypes: string[] | undefined;
  if (typesParam) {
    questionTypes = typesParam.split(',').filter(t => t.trim());
  } else if (questionType) {
    questionTypes = [questionType];
  }

  if (!quizId) {
    return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
  }

  try {
    // Pass questionTypes array to the fetchQuizById function
    const quiz = await fetchQuizById(quizId, questionTypes);
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error(`API Error fetching quiz ${quizId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch quiz', details: error.message }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { fetchQuizById } from '../../../lib/supabaseQuizService'; // We'll keep using the server-side service for API routes

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  // Need to properly handle params in Next.js 15+
  const { quizId } = await params;
  
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
import { NextResponse } from 'next/server';
import { fetchQuizById } from '../../../lib/supabaseQuizService'; // We'll keep using the server-side service for API routes

export async function GET(
  request: Request,
  { params }: { params: { quizId: string } }
) {
  // Need to properly handle params in Next.js 13+
  const quizId = (await Promise.resolve(params)).quizId;
  
  // Extract questionType from URL if present
  const url = new URL(request.url);
  const questionType = url.searchParams.get('questionType');

  if (!quizId) {
    return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
  }

  try {
    // Pass questionType to the fetchQuizById function
    const quiz = await fetchQuizById(quizId, questionType || undefined);
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error(`API Error fetching quiz ${quizId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch quiz', details: error.message }, { status: 500 });
  }
} 
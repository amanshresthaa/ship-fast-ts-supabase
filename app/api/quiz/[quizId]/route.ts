import { NextResponse } from 'next/server';
import { fetchQuizById } from '../../../lib/quizService'; // Corrected path

export async function GET(
  request: Request, // Added request parameter, though not used for query params here
  { params }: { params: { quizId: string } }
) {
  const quizId = params.quizId;

  if (!quizId) {
    return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
  }

  try {
    const quiz = await fetchQuizById(quizId);
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error(`API Error fetching quiz ${quizId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch quiz', details: error.message }, { status: 500 });
  }
} 
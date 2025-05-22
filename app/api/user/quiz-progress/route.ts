import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Define types for the request body and response
interface QuizProgressRequestBody {
  quizId: string;
  questionTypeFilter?: string;
  currentQuestionIndex: number;
  userAnswers: Record<string, any>;
  isExplicitlyCompleted?: boolean;
}

interface QuizProgressResponse {
  id: string;
  user_id: string;
  quiz_id: string;
  question_type_filter: string | null;
  current_question_index: number;
  user_answers: Record<string, any>;
  is_explicitly_completed: boolean;
  last_saved_at: string;
  created_at: string;
}

// Handle GET requests to fetch user quiz progress
export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // Verify user is authenticated
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const quizId = searchParams.get('quizId');
  const questionTypeFilter = searchParams.get('questionTypeFilter');
  
  // Validate required parameters
  if (!quizId) {
    return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
  }
  
  try {
    // Query user progress based on quizId and optional questionTypeFilter
    const query = supabase
      .from('user_quiz_progress')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('quiz_id', quizId);
    
    // Apply questionTypeFilter if provided
    if (questionTypeFilter) {
      query.eq('question_type_filter', questionTypeFilter);
    } else {
      query.is('question_type_filter', null);
    }
    
    const { data, error } = await query.single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is ok
      throw error;
    }
    
    if (!data) {
      return NextResponse.json({ progress: null });
    }
    
    return NextResponse.json({ progress: data });
  } catch (error) {
    console.error('Error fetching quiz progress:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz progress' }, { status: 500 });
  }
}

// Handle POST requests to save user quiz progress
export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // Verify user is authenticated
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  // Parse request body
  let body: QuizProgressRequestBody;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  
  // Validate required fields
  if (!body.quizId) {
    return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
  }
  
  if (body.currentQuestionIndex === undefined) {
    return NextResponse.json({ error: 'Current question index is required' }, { status: 400 });
  }
  
  if (!body.userAnswers) {
    return NextResponse.json({ error: 'User answers are required' }, { status: 400 });
  }
  
  try {
    // Upsert the user progress
    const { data, error } = await supabase
      .from('user_quiz_progress')
      .upsert({
        user_id: session.user.id,
        quiz_id: body.quizId,
        question_type_filter: body.questionTypeFilter || null,
        current_question_index: body.currentQuestionIndex,
        user_answers: body.userAnswers,
        is_explicitly_completed: body.isExplicitlyCompleted || false,
      })
      .select('*')
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true, progress: data });
  } catch (error) {
    console.error('Error saving quiz progress:', error);
    return NextResponse.json({ error: 'Failed to save quiz progress' }, { status: 500 });
  }
}

// Handle DELETE requests to remove user quiz progress
export async function DELETE(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // Verify user is authenticated
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const quizId = searchParams.get('quizId');
  const questionTypeFilter = searchParams.get('questionTypeFilter');
  
  // Validate required parameters
  if (!quizId) {
    return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
  }
  
  try {
    // Delete the user progress
    const query = supabase
      .from('user_quiz_progress')
      .delete()
      .eq('user_id', session.user.id)
      .eq('quiz_id', quizId);
    
    // Apply questionTypeFilter if provided
    if (questionTypeFilter) {
      query.eq('question_type_filter', questionTypeFilter);
    } else {
      query.is('question_type_filter', null);
    }
    
    const { error } = await query;
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quiz progress:', error);
    return NextResponse.json({ error: 'Failed to delete quiz progress' }, { status: 500 });
  }
}
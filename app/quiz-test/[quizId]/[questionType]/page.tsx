import React from 'react';
import ClientQuizPage from '../client-page';

// This is a server component that properly handles async params in Next.js 15
export default async function QuizTestByTypePage({ params }: { params: Promise<{ quizId: string, questionType: string }> }) {
  // Using server component to access params properly - need to await params in Next.js 13+
  const { quizId, questionType } = await params;
  
  // Pass the quizId and questionType to the client component
  return <ClientQuizPage quizId={quizId} questionType={questionType} />;
}

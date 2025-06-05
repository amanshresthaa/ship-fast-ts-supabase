import React from 'react';
import ClientQuizPage from './client-page';

// This is a server component that properly handles async params in Next.js 15
export default async function QuizTestPage({ params }: { params: Promise<{ quizId: string }> }) {
  // Using server component to access params properly
  const { quizId } = await params;
  
  // Pass the quizId to the client component
  return <ClientQuizPage quizId={quizId} />;
}
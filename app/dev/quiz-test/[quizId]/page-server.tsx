import React from 'react';
import ClientQuizPage from './client-page';

// This is a server component that can properly handle async params
export default async function QuizTestPage({ params }: { params: { quizId: string } }) {
  // Server-side logic can go here if needed
  const quizId = params.quizId;
  
  // Render the client component with the quizId
  return <ClientQuizPage quizId={quizId} />;
}

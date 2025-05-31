import React from 'react';
import ClientQuizPage from './client-page';

// Server component for canonical quiz route
export default async function QuizPage({ params }: { params: { quizId: string } }) {
  // Properly await the params object itself before destructuring
  const { quizId } = await params;
  return <ClientQuizPage quizId={quizId} />;
}

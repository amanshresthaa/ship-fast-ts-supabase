import React from 'react';
import ClientQuizPage from './client-page';

// Server component for canonical quiz route
export default async function QuizPage({ params }: { params: { quizId: string } }) {
  const { quizId } = params;
  return <ClientQuizPage quizId={quizId} />;
}

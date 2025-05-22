import React from 'react';
import ClientQuizPage from '../../client-page';

export default async function QuizByTypePage({ params }: { params: { quizId: string; questionType: string } }) {
  // Properly await the params object itself before destructuring
  const { quizId, questionType } = await params;
  
  return <ClientQuizPage quizId={quizId} questionType={questionType} />;
}

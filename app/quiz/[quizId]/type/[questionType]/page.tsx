import React from 'react';
import ClientQuizPage from '../../client-page';

export default async function QuizByTypePage({ params }: { params: Promise<{ quizId: string; questionType: string }> }) {
  const { quizId, questionType } = await params;
  return <ClientQuizPage quizId={quizId} questionType={questionType} />;
}

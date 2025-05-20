import React from 'react';
import ClientQuizPage from '../../client-page';

export default async function QuizByTypePage({ params }: { params: { quizId: string; questionType: string } }) {
  const { quizId, questionType } = params;
  return <ClientQuizPage quizId={quizId} questionType={questionType} />;
}

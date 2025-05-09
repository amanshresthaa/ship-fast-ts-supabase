'use client';

import React from 'react';
import { QuizProvider } from '../../features/quiz/context/QuizContext';
import QuizPage from '../../features/quiz/pages/QuizPage';

// This is a client component that receives the quizId as a prop
export default function ClientQuizPage({ quizId }: { quizId: string }) {
  return (
    <QuizProvider>
      <QuizPage quizId={quizId} />
    </QuizProvider>
  );
}

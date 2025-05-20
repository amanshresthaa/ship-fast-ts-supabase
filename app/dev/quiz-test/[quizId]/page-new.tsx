'use client';

import React from 'react';
import { QuizProvider } from '../../features/quiz/context/QuizContext';
import QuizPage from '../../features/quiz/pages/QuizPage';

// Simple wrapper component that provides the QuizContext
export default async function QuizTestPage({ params }: { params: { quizId: string } }) {
  // Using async function to address the "params should be awaited" warning
  const quizId = params.quizId;
  
  return (
    <QuizProvider>
      <QuizPage quizId={quizId} />
    </QuizProvider>
  );
}

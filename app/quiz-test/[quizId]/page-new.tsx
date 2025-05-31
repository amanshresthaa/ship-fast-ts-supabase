'use client';

import React from 'react';
import { QuizProvider } from '../../features/quiz/context/QuizContext';
import QuizPage from '../../features/quiz/pages/QuizPage';

// Simple wrapper component that provides the QuizContext
export default function QuizTestPage({ params }: { params: { quizId: string } }) {
  // Using direct access to params since this is a client component
  const quizId = params.quizId;
  
  return (
    <QuizProvider>
      <QuizPage quizId={quizId} />
    </QuizProvider>
  );
}

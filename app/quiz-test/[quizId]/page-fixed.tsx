'use client';

import React from 'react';
import { QuizProvider } from '../../features/quiz/context/QuizContext';
import QuizPage from '../../features/quiz/pages/QuizPage';

// Simple wrapper component that provides the QuizContext
const QuizTestPage: React.FC<{ params: { quizId: string } }> = ({ params }) => {
  return (
    <QuizProvider>
      <QuizPage quizId={params.quizId} />
    </QuizProvider>
  );
};

export default QuizTestPage;

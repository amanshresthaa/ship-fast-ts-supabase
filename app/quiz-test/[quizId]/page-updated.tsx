'use client';

import React from 'react';
import { QuizProvider } from '../../features/quiz/context/QuizContext';
import QuizRunnerComponent from '../../features/quiz/pages/QuizPage';

// Page component serving as a wrapper
const QuizPage: React.FC<{ params: { quizId: string } }> = ({ params }) => {
  return (
    <QuizProvider>
      <QuizRunnerComponent quizId={params.quizId} />
    </QuizProvider>
  );
};

export default QuizPage;

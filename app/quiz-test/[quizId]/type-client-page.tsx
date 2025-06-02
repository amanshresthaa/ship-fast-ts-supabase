'use client';

import React from 'react';
import { QuizProvider } from '../../features/quiz/context/QuizContext';
import QuizPage from '../../features/quiz/pages/QuizPage';

interface QuizTypeClientPageProps {
  quizId: string;
  questionType: string;
}

export default function QuizTypeClientPage({ quizId, questionType }: QuizTypeClientPageProps) {
  return (
    <QuizProvider>
      <QuizPage quizId={quizId} questionType={questionType} />
    </QuizProvider>
  );
}

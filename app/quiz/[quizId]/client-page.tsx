'use client';

import React from 'react';
import { QuizProvider } from '../../features/quiz/context/QuizContext';
import QuizPage from '../../features/quiz/pages/QuizPage';

interface ClientQuizPageProps {
  quizId: string;
  questionType?: string;
}

export default function ClientQuizPage({ quizId, questionType }: ClientQuizPageProps) {
  return <QuizProvider quizId={quizId} questionType={questionType}>
    <QuizPage quizId={quizId} questionType={questionType} />
  </QuizProvider>;
}

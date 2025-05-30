'use client';

import React from 'react';
import { QuizProvider } from '../features/quiz/context/QuizContext';
import QuizPage from '../features/quiz/pages/QuizPage';

// Client component that provides QuizProvider and renders the quiz page
interface ClientQuizPageWithProviderProps {
  quizId: string;
  questionType?: string;
}

export default function ClientQuizPageWithProvider({ 
  quizId, 
  questionType 
}: ClientQuizPageWithProviderProps) {
  return (
    <QuizProvider>
      <QuizPage quizId={quizId} questionType={questionType} />
    </QuizProvider>
  );
}

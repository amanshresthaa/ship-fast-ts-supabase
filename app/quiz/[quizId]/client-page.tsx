'use client';

import React from 'react';
import { QuizProvider } from '../../features/quiz/context/QuizContext';
import QuizPage from '../../features/quiz/pages/QuizPage';

interface ClientQuizPageProps {
  quizId: string;
  questionType?: string;
  spacedRepetitionMode?: boolean;
}

export default function ClientQuizPage({ 
  quizId, 
  questionType, 
  spacedRepetitionMode 
}: ClientQuizPageProps) {
  return (
    <QuizProvider 
      quizId={quizId} 
      questionType={questionType}
      spacedRepetitionMode={spacedRepetitionMode}
    >
      <QuizPage 
        quizId={quizId} 
        questionType={questionType}
        spacedRepetitionMode={spacedRepetitionMode}
      />
    </QuizProvider>
  );
}

'use client';

import React from 'react';
import { QuizProvider } from '../../features/quiz/context/QuizContext';
import QuizPage from '../../features/quiz/pages/QuizPage';

/**
 * Renders the quiz test page with context for a specific quiz.
 *
 * Wraps the {@link QuizPage} component in a {@link QuizProvider} and passes the quiz ID from {@link params}.
 *
 * @param params - Object containing the quiz ID to display.
 */
export default function QuizTestPage({ params }: { params: { quizId: string } }) {
  // Using direct access to params since this is a client component
  const quizId = params.quizId;
  
  return (
    <QuizProvider>
      <QuizPage quizId={quizId} />
    </QuizProvider>
  );
}

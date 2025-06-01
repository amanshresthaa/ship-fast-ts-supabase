'use client';

import React from 'react';
import { QuizProvider } from '../../features/quiz/context/QuizContext';
import QuizPage from '../../features/quiz/pages/QuizPage';

interface ClientQuizPageProps {
  quizId: string;
  questionType?: string;
}

/**
 * Renders the quiz page within a quiz context provider.
 *
 * Wraps the {@link QuizPage} component with {@link QuizProvider} to supply quiz-related context, passing the provided {@link quizId} and optional {@link questionType} to the quiz page.
 *
 * @param quizId - The unique identifier for the quiz to display.
 * @param questionType - Optional type of questions to filter or display.
 */
export default function ClientQuizPage({ quizId, questionType }: ClientQuizPageProps) {
  return <QuizProvider>
    <QuizPage quizId={quizId} questionType={questionType} />
  </QuizProvider>;
}

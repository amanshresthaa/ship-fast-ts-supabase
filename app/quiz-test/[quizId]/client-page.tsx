'use client';

import React from 'react';
import { QuizProvider } from '../../features/quiz/context/QuizContext';
import QuizPage from '../../features/quiz/pages/QuizPage';

// This is a client component that receives the quizId and optional questionType as props
interface ClientQuizPageProps {
  quizId: string;
  questionType?: string;
}

/**
 * Renders the quiz page for a given quiz ID and optional question type.
 *
 * Passes the provided {@link quizId} and {@link questionType} to the {@link QuizPage} component.
 *
 * @param quizId - The unique identifier of the quiz to display.
 * @param questionType - (Optional) The type of questions to filter or display.
 */
export default function ClientQuizPage({ quizId, questionType }: ClientQuizPageProps) {
  // Don't wrap in QuizProvider here as it's already provided in the layout
  return <QuizPage quizId={quizId} questionType={questionType} />;
}

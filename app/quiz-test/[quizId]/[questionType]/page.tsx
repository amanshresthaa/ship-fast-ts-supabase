import React from 'react';
import ClientQuizPage from '../client-page';

/**
 * Renders the quiz test page for a specific quiz and question type.
 *
 * @param params - An object containing the quiz ID and question type.
 * @returns A React element displaying the quiz page for the given quiz and question type.
 */
export default async function QuizTestByTypePage({ params }: { params: { quizId: string, questionType: string } }) {
  // Using server component to access params properly - need to await params in Next.js 13+
  const resolvedParams = await Promise.resolve(params);
  const { quizId, questionType } = resolvedParams;
  
  // Pass the quizId and questionType to the client component
  return <ClientQuizPage quizId={quizId} questionType={questionType} />;
}

import React from 'react';
import ClientQuizPage from './client-page';

/**
 * Renders the quiz test page server component, extracting the quiz ID from asynchronous route parameters and passing it to the client component.
 *
 * @param params - An object containing the quiz ID as a route parameter.
 * @returns The rendered {@link ClientQuizPage} component with the provided quiz ID.
 */
export default async function QuizTestPage({ params }: { params: { quizId: string } }) {
  // Server-side logic can go here if needed
  const { quizId } = await params;
  
  // Render the client component with the quizId
  return <ClientQuizPage quizId={quizId} />;
}

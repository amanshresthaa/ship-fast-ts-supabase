import React from 'react';
import ClientQuizPage from './client-page';

/**
 * Server component that renders the quiz page for a given quiz ID.
 *
 * Awaits the route parameters to extract the {@link quizId} and passes it to the {@link ClientQuizPage} component for client-side rendering.
 *
 * @param params - Route parameters containing the quiz ID.
 * @returns The rendered quiz page for the specified quiz.
 */
export default async function QuizPage({ params }: { params: { quizId: string } }) {
  // Properly await the params object itself before destructuring
  const { quizId } = await params;
  return <ClientQuizPage quizId={quizId} />;
}

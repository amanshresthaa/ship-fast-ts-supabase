import React from 'react';
import ClientQuizPage from './client-page';

/**
 * Renders the quiz test page server component, extracting the quiz ID from asynchronous route parameters and passing it to the client component.
 *
 * @param params - An object containing the quiz ID as a string.
 * @returns The rendered client quiz page for the specified quiz.
 *
 * @remark Awaits the route parameters to support asynchronous parameter resolution in Next.js 15.
 */
export default async function QuizTestPage({ params }: { params: { quizId: string } }) {
  // Using server component to access params properly
  const { quizId } = await params;
  
  // Pass the quizId to the client component
  return <ClientQuizPage quizId={quizId} />;
}
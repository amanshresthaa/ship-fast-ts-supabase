// Spaced Repetition Quiz Page - integrates spaced repetition into the main quiz pipeline
import React from 'react';
import ClientQuizPageWithProvider from './client-page';

// This page handles spaced repetition quizzes using the same UX/UI as regular quizzes
export default async function SpacedRepetitionQuizPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ topic?: string; limit?: string }> 
}) {
  // Await searchParams for Next.js 15 compatibility
  const params = await searchParams;
  const topic = params.topic;
  const limit = params.limit;
  
  // Use the special quiz ID "spaced-repetition" which triggers spaced repetition mode in QuizService
  // Pass topic as questionType parameter to maintain API consistency
  return <ClientQuizPageWithProvider quizId="spaced-repetition" questionType={topic} />;
}

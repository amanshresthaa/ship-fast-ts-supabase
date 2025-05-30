import React from 'react';
import ClientQuizPage from './client-page';

// Server component for canonical quiz route
export default async function QuizPage({ 
  params, 
  searchParams 
}: { 
  params: { quizId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Properly await the params object itself before destructuring
  const { quizId } = await params;
  const resolvedSearchParams = await searchParams;
  
  // Extract spaced repetition mode from search params
  const spacedRepetitionMode = resolvedSearchParams.spacedRepetition === 'true';
  const questionType = typeof resolvedSearchParams.questionType === 'string' ? resolvedSearchParams.questionType : undefined;
  
  return (
    <ClientQuizPage 
      quizId={quizId} 
      questionType={questionType}
      spacedRepetitionMode={spacedRepetitionMode}
    />
  );
}

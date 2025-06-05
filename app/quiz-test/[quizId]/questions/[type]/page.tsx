import React from 'react';
import QuizTypeClientPage from '../../type-client-page';

// This is a server component that properly handles async params in Next.js
export default async function QuizByTypeAndQuestionTypePage({ params }: { params: Promise<{ quizId: string, type: string }> }) {
  // Using server component to access params properly
  const { quizId, type } = await params;
  
  // Pass the quizId and questionType to the client component
  return <QuizTypeClientPage quizId={quizId} questionType={type} />;
}

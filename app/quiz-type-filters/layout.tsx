import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quiz Type Filters | Test Your Knowledge',
  description: 'Filter quizzes by question type - single selection, multiple choice, drag and drop, and more!',
};

export default function QuizTypeFiltersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

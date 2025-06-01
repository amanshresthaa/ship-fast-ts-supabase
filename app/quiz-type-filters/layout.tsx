import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learning Mode Quiz Type Filters | Test Your Knowledge',
  description: 'Filter learning mode quizzes by question type - single selection, multiple choice, drag and drop, and more!',
};

/**
 * Provides a layout wrapper for the Learning Mode Quiz Type Filters page.
 *
 * Renders the given {@link children} within a React fragment without additional layout or logic.
 *
 * @param children - The content to display within the layout.
 */
export default function QuizTypeFiltersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

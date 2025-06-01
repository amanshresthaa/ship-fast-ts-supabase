'use client';

import { QuizProvider } from '@/app/features/quiz/context/QuizContext';
import React from 'react';

/**
 * Provides quiz context to all nested components within its children.
 *
 * Wraps the given {@link children} with {@link QuizProvider} to enable access to quiz-related state and functionality throughout the component tree.
 *
 * @param children - The React nodes to render within the quiz context.
 */
export default function QuizTestLayout({ children }: { children: React.ReactNode }) {
  return <QuizProvider>{children}</QuizProvider>;
}

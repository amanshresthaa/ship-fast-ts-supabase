'use client';

import { QuizProvider } from '@/app/features/quiz/context/QuizContext';
import React from 'react';

export default function QuizTestLayout({ children }: { children: React.ReactNode }) {
  return <QuizProvider>{children}</QuizProvider>;
}

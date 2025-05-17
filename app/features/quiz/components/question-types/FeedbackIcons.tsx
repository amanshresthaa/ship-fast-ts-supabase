// app/features/quiz/components/question-types/FeedbackIcons.tsx
'use client';

import React, { memo } from 'react';

/**
 * CorrectIcon - Displays a checkmark inside a green circle
 * Used to indicate a correct answer in quizzes
 */
export const CorrectIcon = memo(() => (
  <span className="option-icon inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-sm bg-success-gradient shadow-md">
    ✓
  </span>
));

/**
 * IncorrectIcon - Displays an X inside a red circle
 * Used to indicate an incorrect answer in quizzes
 */
export const IncorrectIcon = memo(() => (
  <span className="option-icon inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-sm bg-error-gradient shadow-md">
    ✗
  </span>
));

// Default export for convenience when importing both
const FeedbackIcons = {
  CorrectIcon,
  IncorrectIcon
};

export default FeedbackIcons;

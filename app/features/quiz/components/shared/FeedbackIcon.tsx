import React, { memo } from 'react';

interface FeedbackIconProps {
  type: 'correct' | 'incorrect';
  className?: string;
}

const FeedbackIcon: React.FC<FeedbackIconProps> = memo(({ type, className }) => {
  if (type === 'correct') {
    return (
      <span className={`option-icon inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-sm bg-success-gradient shadow-md ${className || ''}`}>
        ✓
      </span>
    );
  }
  return (
    <span className={`option-icon inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-sm bg-error-gradient shadow-md ${className || ''}`}>
      ✗
    </span>
  );
});

FeedbackIcon.displayName = 'FeedbackIcon';
export default FeedbackIcon;

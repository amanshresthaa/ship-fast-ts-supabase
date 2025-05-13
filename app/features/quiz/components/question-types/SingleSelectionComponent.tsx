'use client';

import React, { memo } from 'react';
import { SingleSelectionQuestion, SelectionOption } from '../../../../types/quiz';
import QuizOption from '../shared/QuizOption'; // Import the new QuizOption component

interface SingleSelectionComponentProps {
  question: SingleSelectionQuestion;
  onAnswerSelect: (optionId: string) => void;
  selectedOptionId?: string | null;
  isSubmitted?: boolean;
  showFeedback?: boolean; // Standardized prop name
}

const SingleSelectionComponent: React.FC<SingleSelectionComponentProps> = ({
  question,
  onAnswerSelect,
  selectedOptionId,
  isSubmitted = false,
  showFeedback = false, // Standardized prop name
}) => {
  const handleOptionClick = (optionId: string) => {
    if (!isSubmitted) {
      onAnswerSelect(optionId);
    }
  };

  return (
    <div className="options-container grid grid-cols-1 gap-4 mb-8">
      {question.options.map((option: SelectionOption, index: number) => {
        const isSelected = selectedOptionId === option.option_id;
        const isCorrect = question.correctAnswerOptionId === option.option_id;
        const optionLetter = String.fromCharCode(65 + index);

        return (
          <QuizOption
            key={option.option_id}
            option={option}
            optionLetter={optionLetter}
            isSelected={isSelected}
            isCorrect={isCorrect}
            isSubmitted={isSubmitted}
            showFeedback={showFeedback}
            onClick={handleOptionClick}
            disabled={isSubmitted}
          />
        );
      })}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(SingleSelectionComponent);

'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { MultiChoiceQuestion, SelectionOption } from '../../../../types/quiz';
import QuizOption from '../shared/QuizOption'; // Import the new QuizOption component

interface MultiChoiceComponentProps {
  question: MultiChoiceQuestion;
  onAnswerSelect: (optionIds: string[]) => void;
  selectedOptionIds?: string[];
  isSubmitted?: boolean;
  showFeedback?: boolean; // Standardized prop name
}

const MultiChoiceComponent: React.FC<MultiChoiceComponentProps> = ({
  question,
  onAnswerSelect,
  selectedOptionIds = [],
  isSubmitted = false,
  showFeedback = false, // Standardized prop name
}) => {
  // Determine the correct number of answers to select
  const correctAnswersCount = question.correctAnswerOptionIds.length;
  
  const handleOptionClick = (optionId: string) => {
    if (!isSubmitted) {
      // If option is already selected, allow deselecting it
      if (selectedOptionIds.includes(optionId)) {
        const newSelectedOptions = selectedOptionIds.filter(id => id !== optionId);
        onAnswerSelect(newSelectedOptions);
      } 
      // If we haven't reached the limit yet, allow selecting the option
      else if (selectedOptionIds.length < correctAnswersCount) {
        const newSelectedOptions = [...selectedOptionIds, optionId];
        onAnswerSelect(newSelectedOptions);
        
        // If we've reached the required number of selections, auto-submit
        if (newSelectedOptions.length === correctAnswersCount) {
          setTimeout(() => onAnswerSelect(newSelectedOptions), 150); // Small delay for better UX
        }
      }
      // If we've reached the limit, don't allow more selections
    }
  };

  return (
    <div className="options-container grid grid-cols-1 gap-4 mb-8">
      <p className="text-sm text-gray-500 mb-2 font-medium">
        Select {question.correctAnswerOptionIds.length} answer{question.correctAnswerOptionIds.length > 1 ? 's' : ''} ({selectedOptionIds.length}/{question.correctAnswerOptionIds.length} selected)
      </p>

      {question.options.map((option: SelectionOption, index: number) => {
        const isSelected = selectedOptionIds.includes(option.option_id);
        const isCorrect = question.correctAnswerOptionIds.includes(option.option_id);
        const optionLetter = String.fromCharCode(65 + index);

        // Determine if the option should be disabled
        // Disable if submitted, or if max selections reached and this option is not already selected.
        const isDisabled = isSubmitted || (selectedOptionIds.length >= correctAnswersCount && !isSelected);

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
            disabled={isDisabled} // Pass calculated disabled state
          />
        );
      })}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(MultiChoiceComponent);

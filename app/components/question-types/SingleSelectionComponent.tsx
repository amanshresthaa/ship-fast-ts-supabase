'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SingleSelectionQuestion, SingleSelectionOption } from '../../types/quiz'; // Corrected path

interface SingleSelectionComponentProps {
  question: SingleSelectionQuestion;
  onAnswerSelect: (optionId: string) => void; // Callback to notify parent of selection
  selectedOptionId?: string | null; // Controlled by parent (QuizContext)
  isSubmitted?: boolean; // To disable controls after submission or show correct/incorrect states
  showCorrectAnswer?: boolean; // To highlight the correct answer after evaluation
}

const SingleSelectionComponent: React.FC<SingleSelectionComponentProps> = ({
  question,
  onAnswerSelect,
  selectedOptionId,
  isSubmitted = false,
  showCorrectAnswer = false,
}) => {

  const handleOptionClick = (optionId: string) => {
    if (!isSubmitted) {
      onAnswerSelect(optionId);
    }
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {question.options.map((option: SingleSelectionOption) => {
        const isSelected = selectedOptionId === option.option_id;
        const isCorrect = question.correctAnswerOptionId === option.option_id;
        
        // Base classes for all options - could use DaisyUI btn class as well
        let baseStyle = "w-full text-left p-3 md:p-4 border rounded-lg text-base md:text-lg transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 font-medium";
        let stateStyle = "";

        if (isSubmitted || showCorrectAnswer) {
          // Feedback state (after submission or when showing answers)
          if (isCorrect) {
            stateStyle = "bg-green-100 border-green-400 text-green-700 hover:bg-green-200 ring-2 ring-green-500 shadow-md";
          } else if (isSelected && !isCorrect) {
            stateStyle = "bg-red-100 border-red-400 text-red-700 hover:bg-red-200 ring-2 ring-red-500 shadow-md";
          } else {
            // Non-selected, non-correct options when feedback is shown (e.g. quiz review)
            stateStyle = "bg-gray-100 border-gray-300 text-gray-600 cursor-default opacity-80";
          }
        } else {
          // Interactive state (before submission)
          if (isSelected) {
            stateStyle = "bg-indigo-500 border-indigo-600 text-white ring-2 ring-indigo-500 shadow-lg";
          } else {
            stateStyle = "bg-white border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-400 focus:border-indigo-500";
          }
        }
        
        return (
          <motion.button
            key={option.option_id}
            type="button"
            onClick={() => handleOptionClick(option.option_id)}
            className={`${baseStyle} ${stateStyle}`}
            disabled={isSubmitted} // Disable after submission
            aria-pressed={isSelected}
            whileHover={{ scale: (isSubmitted || (isSelected && !showCorrectAnswer)) ? 1 : 1.03, transition: { duration: 0.15 } }} // Subtle hover unless submitted or already selected
            whileTap={{ scale: isSubmitted ? 1 : 0.97, transition: { duration: 0.1 } }} // Tap animation unless submitted
            // Animate layout changes if needed, e.g. if button size changes dynamically
            // layout 
          >
            {option.text}
            {/* Improved feedback indicators */}
            {(isSubmitted || showCorrectAnswer) && isCorrect && 
              <span className="ml-2 font-bold text-green-600">✓ Correct</span>}
            {(isSubmitted || showCorrectAnswer) && isSelected && !isCorrect && 
              <span className="ml-2 font-bold text-red-600">✗ Your Pick</span>}
          </motion.button>
        );
      })}
    </div>
  );
};

export default SingleSelectionComponent; 
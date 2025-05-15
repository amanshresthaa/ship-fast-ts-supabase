'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { YesNoQuestion } from '@/app/types/quiz';
import { YesNoController } from '../../controllers/YesNoController';
import { useAutoValidation } from '../../hooks/useAutoValidation';

// Icons for feedback
const CorrectIcon = memo(() => (
  <span className="option-icon inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-sm bg-success-gradient shadow-md">✓</span>
));

const IncorrectIcon = memo(() => (
  <span className="option-icon inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-sm bg-error-gradient shadow-md">✗</span>
));

interface YesNoComponentProps {
  question: YesNoQuestion;
  onAnswerSelect: (answer: boolean) => void;
  selectedAnswer?: boolean | null;
  isSubmitted?: boolean;
  showCorrectAnswer?: boolean;
}

const YesNoComponent: React.FC<YesNoComponentProps> = ({
  question,
  onAnswerSelect,
  selectedAnswer = null,
  isSubmitted = false,
  showCorrectAnswer = false,
}) => {
  // Create controller instance
  const controller = new YesNoController(question);

  // Use auto-validation hook with auto-submit and immediate feedback
  const [currentSelection, setCurrentSelection, isValidating, isComplete] = useAutoValidation(
    controller,
    selectedAnswer ?? null,
    (answer) => {
      if (answer !== null) onAnswerSelect(answer);
    },
    true // validateOnComplete: auto-submit when answer is complete
  );

  // Reset selection when question changes
  React.useEffect(() => {
    // Clear current selection on new question
    setCurrentSelection(null);
  }, [question.id]);

  // Handle option selection
  const handleOptionClick = (answer: boolean) => {
    if (!isSubmitted) {
      setCurrentSelection(answer);
      // Explicitly call onAnswerSelect to ensure immediate feedback
      onAnswerSelect(answer);
    }
  };

  return (
    <div className="options-container grid grid-cols-2 gap-4 mb-8">
      {/* Yes button */}
      <motion.button
        type="button"
        onClick={() => handleOptionClick(true)}
        className={`
          relative text-left p-5 border-2 rounded-rounded-md-ref bg-white 
          transition-all duration-200 ease-in-out shadow-shadow-1 overflow-hidden
          ${isSubmitted ? "cursor-default" : "cursor-pointer hover:-translate-y-1 hover:shadow-shadow-2 hover:border-custom-primary"}
          ${currentSelection === true 
            ? "border-custom-primary ring-2 ring-custom-primary shadow-shadow-2" 
            : "border-custom-gray-3"}
          ${(isSubmitted || showCorrectAnswer) && controller.getCorrectAnswer() === true 
            ? "border-custom-success bg-green-500/[.05]" 
            : ""}
          ${(isSubmitted || showCorrectAnswer) && currentSelection === true && controller.getCorrectAnswer() !== true 
            ? "border-custom-error bg-red-500/[.05]" 
            : ""}
          ${(isSubmitted || showCorrectAnswer) && currentSelection !== true 
            ? "bg-gray-50 opacity-70" 
            : ""}
        `}
        disabled={isSubmitted}
        aria-pressed={currentSelection === true}
        whileHover={{ scale: isSubmitted ? 1 : 1.02, transition: { duration: 0.15 } }} 
        whileTap={{ scale: isSubmitted ? 1 : 0.98, transition: { duration: 0.1 } }} 
        layout
      >
        {/* Accent border */}
        <span 
          className={`absolute top-0 left-0 w-1 h-full transition-all duration-200 ease-in-out 
            ${currentSelection === true ? 'bg-custom-primary' : ''}
            ${(isSubmitted || showCorrectAnswer) && controller.getCorrectAnswer() === true ? 'bg-custom-success' : ''}
            ${(isSubmitted || showCorrectAnswer) && currentSelection === true && controller.getCorrectAnswer() !== true ? 'bg-custom-error' : ''}
            ${!(currentSelection === true || ((isSubmitted || showCorrectAnswer) && controller.getCorrectAnswer() === true)) ? 'bg-custom-gray-3' : ''}
          `}
        ></span>

        <div className="option-content flex items-center justify-between pl-4">
          <div className="option-text text-base md:text-lg font-medium text-custom-gray-1">
            Yes
          </div>
          {/* Show feedback icon when submitted or in show correct answer mode */}
          {(isSubmitted || showCorrectAnswer) && (
            <div className="ml-3">
              {controller.getCorrectAnswer() === true ? (
                <CorrectIcon />
              ) : (
                currentSelection === true && <IncorrectIcon />
              )}
            </div>
          )}
        </div>
      </motion.button>

      {/* No button */}
      <motion.button
        type="button"
        onClick={() => handleOptionClick(false)}
        className={`
          relative text-left p-5 border-2 rounded-rounded-md-ref bg-white 
          transition-all duration-200 ease-in-out shadow-shadow-1 overflow-hidden
          ${isSubmitted ? "cursor-default" : "cursor-pointer hover:-translate-y-1 hover:shadow-shadow-2 hover:border-custom-primary"}
          ${currentSelection === false 
            ? "border-custom-primary ring-2 ring-custom-primary shadow-shadow-2" 
            : "border-custom-gray-3"}
          ${(isSubmitted || showCorrectAnswer) && controller.getCorrectAnswer() === false 
            ? "border-custom-success bg-green-500/[.05]" 
            : ""}
          ${(isSubmitted || showCorrectAnswer) && currentSelection === false && controller.getCorrectAnswer() !== false 
            ? "border-custom-error bg-red-500/[.05]" 
            : ""}
          ${(isSubmitted || showCorrectAnswer) && currentSelection !== false 
            ? "bg-gray-50 opacity-70" 
            : ""}
        `}
        disabled={isSubmitted}
        aria-pressed={currentSelection === false}
        whileHover={{ scale: isSubmitted ? 1 : 1.02, transition: { duration: 0.15 } }} 
        whileTap={{ scale: isSubmitted ? 1 : 0.98, transition: { duration: 0.1 } }} 
        layout
      >
        {/* Accent border */}
        <span 
          className={`absolute top-0 left-0 w-1 h-full transition-all duration-200 ease-in-out 
            ${currentSelection === false ? 'bg-custom-primary' : ''}
            ${(isSubmitted || showCorrectAnswer) && controller.getCorrectAnswer() === false ? 'bg-custom-success' : ''}
            ${(isSubmitted || showCorrectAnswer) && currentSelection === false && controller.getCorrectAnswer() !== false ? 'bg-custom-error' : ''}
            ${!(currentSelection === false || ((isSubmitted || showCorrectAnswer) && controller.getCorrectAnswer() === false)) ? 'bg-custom-gray-3' : ''}
          `}
        ></span>

        <div className="option-content flex items-center justify-between pl-4">
          <div className="option-text text-base md:text-lg font-medium text-custom-gray-1">
            No
          </div>
          {/* Show feedback icon when submitted or in show correct answer mode */}
          {(isSubmitted || showCorrectAnswer) && (
            <div className="ml-3">
              {controller.getCorrectAnswer() === false ? (
                <CorrectIcon />
              ) : (
                currentSelection === false && <IncorrectIcon />
              )}
            </div>
          )}
        </div>
      </motion.button>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(YesNoComponent);

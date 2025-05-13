import React, { memo } from 'react';
import { motion } from 'framer-motion';
import FeedbackIcon from './FeedbackIcon'; // Assuming FeedbackIcon is in the same directory
import { SelectionOption } from '../../../../types/quiz'; // Adjust path as needed

interface QuizOptionProps {
  option: SelectionOption;
  optionLetter?: string;
  isSelected: boolean;
  isCorrect?: boolean;
  isSubmitted: boolean;
  showFeedback: boolean;
  onClick: (optionId: string) => void;
  disabled?: boolean;
  className?: string;
  baseStyle?: string;
  stateStyle?: string;
  hoverStyle?: string;
}

const QuizOption: React.FC<QuizOptionProps> = memo(
  ({
    option,
    optionLetter,
    isSelected,
    isCorrect,
    isSubmitted,
    showFeedback,
    onClick,
    disabled = false,
    className = '',
    baseStyle = 'relative text-left p-5 border-2 rounded-rounded-md-ref bg-white transition-all duration-200 ease-in-out shadow-shadow-1 overflow-hidden',
    stateStyle: propStateStyle,
    hoverStyle: propHoverStyle,
  }) => {
    let currentHoverStyle = isSubmitted || disabled ? 'cursor-default' : 'cursor-pointer hover:-translate-y-1 hover:shadow-shadow-2 hover:border-custom-primary';
    if (propHoverStyle !== undefined) {
      currentHoverStyle = propHoverStyle;
    }

    let currentStateStyle = 'border-custom-gray-3';
    if (propStateStyle !== undefined) {
      currentStateStyle = propStateStyle;
    } else {
      if (showFeedback) {
        if (isCorrect) {
          currentStateStyle = 'border-custom-success bg-green-500/[.05]';
        } else if (isSelected && !isCorrect) {
          currentStateStyle = 'border-custom-error bg-red-500/[.05]';
        } else {
          currentStateStyle = 'border-custom-gray-3 bg-gray-50 opacity-70';
          currentHoverStyle = 'cursor-default'; // Non-interactive if not selected and feedback is shown
        }
      } else if (isSelected) {
        currentStateStyle = 'border-custom-primary ring-2 ring-custom-primary shadow-shadow-2';
      }
    }

    return (
      <motion.button
        key={option.option_id}
        type="button"
        onClick={() => onClick(option.option_id)}
        className={`${baseStyle} ${currentStateStyle} ${currentHoverStyle} ${className}`}
        disabled={isSubmitted || disabled}
        aria-pressed={isSelected}
        whileHover={{ scale: isSubmitted || disabled ? 1 : 1.02, transition: { duration: 0.15 } }}
        whileTap={{ scale: isSubmitted || disabled ? 1 : 0.98, transition: { duration: 0.1 } }}
        layout
      >
        {/* Accent border */}
        <span
          className={`absolute top-0 left-0 w-1 h-full transition-all duration-200 ease-in-out ${
            isSelected && !showFeedback
              ? 'bg-custom-primary'
              : showFeedback && isCorrect
              ? 'bg-custom-success'
              : showFeedback && isSelected && !isCorrect
              ? 'bg-custom-error'
              : 'bg-custom-gray-3'
          } ${isSubmitted || disabled ? '' : 'group-hover:bg-custom-primary'}`}
        ></span>

        <div className="option-content flex items-center justify-between pl-4">
          <div className="option-text text-base md:text-lg font-medium text-custom-gray-1">
            {optionLetter && (
              <span className="option-letter inline-block w-6 font-bold text-custom-primary mr-2">
                {optionLetter}.
              </span>
            )}
            {option.text}
          </div>

          {/* Show feedback icons when appropriate */}
          {showFeedback && isCorrect && <FeedbackIcon type="correct" />}
          {showFeedback && isSelected && !isCorrect && <FeedbackIcon type="incorrect" />}
        </div>
      </motion.button>
    );
  }
);

QuizOption.displayName = 'QuizOption';
export default QuizOption;

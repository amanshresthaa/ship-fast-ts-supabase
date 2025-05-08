'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SingleSelectionQuestion, SingleSelectionOption } from '../../types/quiz'; // Corrected path

// Icons for options (can be improved or replaced with SVG)
const CorrectIcon = () => <span className="option-icon inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-sm bg-success-gradient shadow-md">✓</span>;
const IncorrectIcon = () => <span className="option-icon inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-sm bg-error-gradient shadow-md">✗</span>;

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
    // Options container with grid layout and gap per reference
    <div className="options-container grid grid-cols-1 gap-4 mb-8">
      {question.options.map((option: SingleSelectionOption, index: number) => {
        const isSelected = selectedOptionId === option.option_id;
        const isCorrect = question.correctAnswerOptionId === option.option_id;
        // Generate option letter (A, B, C...)
        const optionLetter = String.fromCharCode(65 + index);
        
        // Base classes matching .option from reference
        let baseStyle = "relative text-left p-5 border-2 rounded-rounded-md-ref bg-white transition-all duration-200 ease-in-out shadow-shadow-1 overflow-hidden";
        let stateStyle = "border-custom-gray-3"; // Default border
        let hoverStyle = isSubmitted ? "cursor-default" : "cursor-pointer hover:-translate-y-1 hover:shadow-shadow-2 hover:border-custom-primary";
        let accentBorderStyle = "before:content-[''] before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-custom-gray-3 before:transition-all before:duration-200";
        let hoverAccentBorderStyle = isSubmitted ? "" : "hover:before:bg-custom-primary";

        if (isSubmitted || showCorrectAnswer) {
          // Feedback state 
          if (isCorrect) {
            stateStyle = "border-custom-success bg-green-500/[.05]";
            accentBorderStyle = "before:bg-custom-success";
            hoverAccentBorderStyle = ""; // No hover change on feedback
          } else if (isSelected && !isCorrect) {
            stateStyle = "border-custom-error bg-red-500/[.05]";
            accentBorderStyle = "before:bg-custom-error";
            hoverAccentBorderStyle = ""; 
          } else {
            // Non-selected, non-correct options during feedback
            stateStyle = "border-custom-gray-3 bg-gray-50 opacity-70";
            accentBorderStyle = "before:bg-custom-gray-3";
            hoverStyle = "cursor-default"; // Make non-interactive
            hoverAccentBorderStyle = "";
          }
        } else {
          // Interactive state
          if (isSelected) {
            // Using shadow for selected state instead of border to avoid layout shift
            stateStyle = "border-custom-primary ring-2 ring-custom-primary shadow-shadow-2"; 
            accentBorderStyle = "before:bg-custom-primary";
          } else {
            // Default interactive state is handled by baseStyle + hoverStyle
          }
        }
        
        return (
          // Applying styles and Framer Motion animations
          <motion.button
            key={option.option_id}
            type="button"
            onClick={() => handleOptionClick(option.option_id)}
            // Combine all style parts. Note: before: pseudo-elements need to be handled carefully.
            // Tailwind doesn't directly support pseudo-elements in utility classes like this easily.
            // We might need custom CSS or a different approach for the accent border.
            // For now, applying styles that work directly.
            // The accent border is simplified here. A dedicated span could work better.
            className={`${baseStyle} ${stateStyle} ${hoverStyle}`}
            disabled={isSubmitted}
            aria-pressed={isSelected}
            whileHover={{ scale: isSubmitted ? 1 : 1.02, transition: { duration: 0.15 } }} 
            whileTap={{ scale: isSubmitted ? 1 : 0.98, transition: { duration: 0.1 } }} 
            layout // Animate layout changes smoothly
          >
            {/* Accent border implemented with a span */}
            <span className={`absolute top-0 left-0 w-1 h-full transition-all duration-200 ease-in-out ${isSelected ? 'bg-custom-primary' : isCorrect && (isSubmitted || showCorrectAnswer) ? 'bg-custom-success' : isSelected && !isCorrect && (isSubmitted || showCorrectAnswer) ? 'bg-custom-error' : 'bg-custom-gray-3'} ${isSubmitted ? '' : 'group-hover:bg-custom-primary'}`}></span>

            <div className="option-content flex items-center justify-between pl-4"> {/* Added padding left for accent border space */}
              <div className="option-text text-base md:text-lg font-medium text-custom-gray-1">
                <span className="option-letter inline-block w-6 font-bold text-custom-primary mr-2">{optionLetter}.</span>
                {option.text}
              </div>
              {/* Show icon only in feedback state */}
              {(isSubmitted || showCorrectAnswer) && isCorrect && <CorrectIcon />}
              {(isSubmitted || showCorrectAnswer) && isSelected && !isCorrect && <IncorrectIcon />}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default SingleSelectionComponent; 
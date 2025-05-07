'use client';

import React from 'react';
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
    <div className="space-y-3">
      {question.options.map((option: SingleSelectionOption) => {
        const isSelected = selectedOptionId === option.option_id;
        const isCorrect = question.correctAnswerOptionId === option.option_id;
        
        let buttonStyle = "w-full text-left p-3 border rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500";

        if (isSubmitted || showCorrectAnswer) {
          if (isCorrect) {
            buttonStyle += " bg-green-100 border-green-400 text-green-800 hover:bg-green-200";
          } else if (isSelected && !isCorrect) {
            buttonStyle += " bg-red-100 border-red-400 text-red-800 hover:bg-red-200";
          } else {
            buttonStyle += " bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100";
          }
        } else {
          if (isSelected) {
            buttonStyle += " bg-indigo-100 border-indigo-500 ring-2 ring-indigo-500 text-indigo-700";
          } else {
            buttonStyle += " bg-white border-gray-300 hover:bg-gray-50 text-gray-700";
          }
        }
        
        return (
          <button
            key={option.option_id}
            type="button"
            onClick={() => handleOptionClick(option.option_id)}
            className={buttonStyle}
            disabled={isSubmitted}
            aria-pressed={isSelected}
            // aria-label={`Option: ${option.text}`}
          >
            {option.text}
            {showCorrectAnswer && isCorrect && <span className="ml-2 font-semibold text-green-700">(Correct)</span>}
            {showCorrectAnswer && isSelected && !isCorrect && <span className="ml-2 font-semibold text-red-700">(Your Answer)</span>}
          </button>
        );
      })}
    </div>
  );
};

export default SingleSelectionComponent; 
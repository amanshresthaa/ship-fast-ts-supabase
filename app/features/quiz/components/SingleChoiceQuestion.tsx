import React from 'react';
import { SingleSelectionQuestion } from '../types/question-types';

interface SingleChoiceQuestionProps {
  /** The question to display */
  question: SingleSelectionQuestion;
  /** The currently selected answer ID */
  selectedAnswer?: string;
  /** Callback when an answer is selected */
  onChange: (answerId: string) => void;
  /** Whether to show feedback on the answer */
  showFeedback?: boolean;
  /** Whether the selected answer is correct */
  isCorrect?: boolean;
  /** Optional class name for the container */
  className?: string;
}

/**
 * Renders a single-choice question with radio button options
 */
const SingleChoiceQuestion: React.FC<SingleChoiceQuestionProps> = ({
  question,
  selectedAnswer,
  onChange,
  showFeedback = false,
  isCorrect,
  className = '',
}) => {
  const handleOptionChange = (optionId: string) => {
    if (showFeedback) return; // Don't allow changes after submission
    onChange(optionId);
  };

  // Determine if an option is the correct answer
  const isOptionCorrect = (optionId: string) => {
    return showFeedback && optionId === question.correctAnswer;
  };

  // Determine if an option is the selected but incorrect answer
  const isOptionIncorrect = (optionId: string) => {
    return showFeedback && optionId === selectedAnswer && !isCorrect;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <fieldset>
        <legend className="sr-only">Select one option</legend>
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const optionId = `option-${index}`;
            const isChecked = selectedAnswer === optionId;
            const isCorrectOption = isOptionCorrect(optionId);
            const isIncorrectOption = isOptionIncorrect(optionId);
            
            let optionClasses = 'relative flex items-start p-4 rounded-lg border transition-colors ';
            
            if (showFeedback) {
              if (isCorrectOption) {
                optionClasses += 'bg-green-50 border-green-200';
              } else if (isIncorrectOption) {
                optionClasses += 'bg-red-50 border-red-200';
              } else if (isChecked) {
                optionClasses += 'bg-blue-50 border-blue-200';
              } else {
                optionClasses += 'bg-white border-gray-200';
              }
            } else {
              optionClasses += isChecked 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-white border-gray-200 hover:border-blue-200';
            }

            return (
              <div 
                key={optionId}
                className={optionClasses}
                onClick={() => handleOptionChange(optionId)}
              >
                <div className="flex items-center h-5">
                  <input
                    id={optionId}
                    name="answer"
                    type="radio"
                    checked={isChecked}
                    onChange={() => handleOptionChange(optionId)}
                    className={`h-4 w-4 ${
                      showFeedback 
                        ? isCorrectOption 
                          ? 'text-green-600 border-gray-300 focus:ring-green-500'
                          : isIncorrectOption
                            ? 'text-red-600 border-gray-300 focus:ring-red-500'
                            : 'text-blue-600 border-gray-300 focus:ring-blue-500'
                        : 'text-blue-600 border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={showFeedback}
                    aria-describedby={`${optionId}-description`}
                  />
                </div>
                <div className="ml-3">
                  <label 
                    htmlFor={optionId}
                    className={`block text-sm font-medium ${
                      showFeedback 
                        ? isCorrectOption 
                          ? 'text-green-800'
                          : isIncorrectOption
                            ? 'text-red-800'
                            : 'text-gray-700'
                        : 'text-gray-700'
                    }`}
                  >
                    {option}
                  </label>
                  {showFeedback && isCorrectOption && question.explanation && (
                    <p 
                      id={`${optionId}-description`}
                      className="mt-1 text-sm text-green-700"
                    >
                      {question.explanation}
                    </p>
                  )}
                </div>
                {showFeedback && (
                  <div className="ml-auto pl-3">
                    {isCorrectOption ? (
                      <span className="text-green-600">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                    ) : isIncorrectOption ? (
                      <span className="text-red-600">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 0L6 8.586 4.707 7.293a1 1 0 00-1.414 1.414L4.586 10l-1.293 1.293a1 1 0 101.414 1.414L6 11.414l1.293 1.293a1 1 0 001.414-1.414L7.414 10l1.293-1.293a1 1 0 000-1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>
      
      {question.showOtherOption && (
        <div className="mt-4">
          <label 
            htmlFor="other-option"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {question.otherOptionLabel || 'Other (please specify)'}
          </label>
          <input
            type="text"
            id="other-option"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={selectedAnswer !== 'other' || showFeedback}
            onChange={(e) => {
              if (!showFeedback) {
                onChange(`other:${e.target.value}`);
              }
            }}
            value={selectedAnswer?.startsWith('other:') ? selectedAnswer.split(':')[1] || '' : ''}
          />
        </div>
      )}
    </div>
  );
};

export default SingleChoiceQuestion;

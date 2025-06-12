import React from 'react';
import { TrueFalseQuestion, YesNoQuestion } from '../types/question-types';

type QuestionType = TrueFalseQuestion | YesNoQuestion;

interface TrueFalseQuestionProps {
  /** The question to display */
  question: QuestionType;
  /** The selected answer */
  selectedAnswer?: boolean | null;
  /** Callback when an answer is selected */
  onChange: (answer: boolean) => void;
  /** Whether to show feedback on the answer */
  showFeedback?: boolean;
  /** Whether the selected answer is correct */
  isCorrect?: boolean;
  /** Optional class name for the container */
  className?: string;
}

/**
 * Renders a true/false or yes/no question with appropriate options
 */
const TrueFalseQuestion: React.FC<TrueFalseQuestionProps> = ({
  question,
  selectedAnswer,
  onChange,
  showFeedback = false,
  isCorrect,
  className = '',
}) => {
  const isYesNo = question.type === 'yes_no';
  const trueLabel = isYesNo ? question.yesLabel || 'Yes' : 'True';
  const falseLabel = isYesNo ? question.noLabel || 'No' : 'False';
  const showNeutral = isYesNo && question.showNeutralOption;
  
  const handleOptionChange = (value: boolean) => {
    if (showFeedback) return; // Don't allow changes after submission
    onChange(value);
  };

  // Determine if an option is the correct answer
  const isOptionCorrect = (value: boolean) => {
    return showFeedback && question.correctAnswer === value;
  };

  // Determine if an option is the selected but incorrect answer
  const isOptionIncorrect = (value: boolean) => {
    return showFeedback && selectedAnswer === value && !isCorrect;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <fieldset>
        <legend className="sr-only">
          {isYesNo ? 'Select yes or no' : 'Select true or false'}
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* True/Yes Option */}
          <div 
            className={`relative flex p-4 rounded-lg border transition-colors cursor-pointer ${
              showFeedback
                ? isOptionCorrect(true)
                  ? 'bg-green-50 border-green-200'
                  : isOptionIncorrect(true)
                    ? 'bg-red-50 border-red-200'
                    : selectedAnswer === true
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200'
                : selectedAnswer === true
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200 hover:border-blue-200'
            }`}
            onClick={() => handleOptionChange(true)}
          >
            <div className="flex items-center h-5">
              <input
                id="true-option"
                name="true-false-option"
                type="radio"
                checked={selectedAnswer === true}
                onChange={() => handleOptionChange(true)}
                className={`h-4 w-4 ${
                  showFeedback
                    ? isOptionCorrect(true)
                      ? 'text-green-600 border-gray-300 focus:ring-green-500'
                      : isOptionIncorrect(true)
                        ? 'text-red-600 border-gray-300 focus:ring-red-500'
                        : 'text-blue-600 border-gray-300 focus:ring-blue-500'
                    : 'text-blue-600 border-gray-300 focus:ring-blue-500'
                }`}
                disabled={showFeedback}
              />
            </div>
            <div className="ml-3">
              <label 
                htmlFor="true-option"
                className={`block text-sm font-medium ${
                  showFeedback
                    ? isOptionCorrect(true)
                      ? 'text-green-800'
                      : isOptionIncorrect(true)
                        ? 'text-red-800'
                        : 'text-gray-700'
                    : 'text-gray-700'
                }`}
              >
                {trueLabel}
              </label>
            </div>
            {showFeedback && isOptionCorrect(true) && (
              <div className="ml-auto pl-3">
                <span className="text-green-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            )}
            {showFeedback && isOptionIncorrect(true) && (
              <div className="ml-auto pl-3">
                <span className="text-red-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 0L6 8.586 4.707 7.293a1 1 0 00-1.414 1.414L4.586 10l-1.293 1.293a1 1 0 101.414 1.414L6 11.414l1.293 1.293a1 1 0 001.414-1.414L7.414 10l1.293-1.293a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            )}
          </div>

          {/* False/No Option */}
          <div 
            className={`relative flex p-4 rounded-lg border transition-colors cursor-pointer ${
              showFeedback
                ? isOptionCorrect(false)
                  ? 'bg-green-50 border-green-200'
                  : isOptionIncorrect(false)
                    ? 'bg-red-50 border-red-200'
                    : selectedAnswer === false
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200'
                : selectedAnswer === false
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200 hover:border-blue-200'
            }`}
            onClick={() => handleOptionChange(false)}
          >
            <div className="flex items-center h-5">
              <input
                id="false-option"
                name="true-false-option"
                type="radio"
                checked={selectedAnswer === false}
                onChange={() => handleOptionChange(false)}
                className={`h-4 w-4 ${
                  showFeedback
                    ? isOptionCorrect(false)
                      ? 'text-green-600 border-gray-300 focus:ring-green-500'
                      : isOptionIncorrect(false)
                        ? 'text-red-600 border-gray-300 focus:ring-red-500'
                        : 'text-blue-600 border-gray-300 focus:ring-blue-500'
                    : 'text-blue-600 border-gray-300 focus:ring-blue-500'
                }`}
                disabled={showFeedback}
              />
            </div>
            <div className="ml-3">
              <label 
                htmlFor="false-option"
                className={`block text-sm font-medium ${
                  showFeedback
                    ? isOptionCorrect(false)
                      ? 'text-green-800'
                      : isOptionIncorrect(false)
                        ? 'text-red-800'
                        : 'text-gray-700'
                    : 'text-gray-700'
                }`}
              >
                {falseLabel}
              </label>
            </div>
            {showFeedback && isOptionCorrect(false) && (
              <div className="ml-auto pl-3">
                <span className="text-green-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            )}
            {showFeedback && isOptionIncorrect(false) && (
              <div className="ml-auto pl-3">
                <span className="text-red-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 0L6 8.586 4.707 7.293a1 1 0 00-1.414 1.414L4.586 10l-1.293 1.293a1 1 0 101.414 1.414L6 11.414l1.293 1.293a1 1 0 001.414-1.414L7.414 10l1.293-1.293a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            )}
          </div>

          {/* Neutral Option (for Yes/No questions) */}
          {showNeutral && (
            <div 
              className={`relative flex p-4 rounded-lg border transition-colors cursor-pointer ${
                showFeedback
                  ? selectedAnswer === null
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200'
                  : selectedAnswer === null
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200 hover:border-blue-200'
              }`}
              onClick={() => handleOptionChange(null as any)}
            >
              <div className="flex items-center h-5">
                <input
                  id="neutral-option"
                  name="true-false-option"
                  type="radio"
                  checked={selectedAnswer === null}
                  onChange={() => handleOptionChange(null as any)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  disabled={showFeedback}
                />
              </div>
              <div className="ml-3">
                <label 
                  htmlFor="neutral-option"
                  className="block text-sm font-medium text-gray-700"
                >
                  {question.neutralLabel || 'Neutral'}
                </label>
              </div>
            </div>
          )}
        </div>
      </fieldset>

      {/* Feedback */}
      {showFeedback && question.explanation && (
        <div className={`mt-4 p-3 rounded-md ${
          isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <p className="text-sm">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default TrueFalseQuestion;

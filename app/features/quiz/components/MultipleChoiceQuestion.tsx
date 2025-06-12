import React, { useCallback } from 'react';
import { MultiSelectionQuestion } from '../types/question-types';

interface MultipleChoiceQuestionProps {
  /** The question to display */
  question: MultiSelectionQuestion;
  /** Array of selected answer IDs */
  selectedAnswers?: string[];
  /** Callback when answers are updated */
  onChange: (answers: string[]) => void;
  /** Whether to show feedback on the answers */
  showFeedback?: boolean;
  /** Whether the selected answers are correct */
  isCorrect?: boolean;
  /** Optional class name for the container */
  className?: string;
}

/**
 * Renders a multiple-choice question with checkbox options
 */
const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  question,
  selectedAnswers = [],
  onChange,
  showFeedback = false,
  isCorrect,
  className = '',
}) => {
  // Handle toggling an option
  const handleOptionToggle = useCallback((optionId: string) => {
    if (showFeedback) return; // Don't allow changes after submission
    
    const newSelected = selectedAnswers.includes(optionId)
      ? selectedAnswers.filter(id => id !== optionId)
      : [...selectedAnswers, optionId];
    
    // Enforce max selections if specified
    if (question.maxSelections && newSelected.length > question.maxSelections) {
      return;
    }
    
    onChange(newSelected);
  }, [selectedAnswers, onChange, showFeedback, question.maxSelections]);

  // Determine if an option is part of the correct answer
  const isOptionCorrect = useCallback((optionId: string) => {
    return showFeedback && question.correctAnswer.includes(optionId);
  }, [showFeedback, question.correctAnswer]);

  // Determine if an option was incorrectly selected
  const isOptionIncorrect = useCallback((optionId: string) => {
    return showFeedback && 
      selectedAnswers.includes(optionId) && 
      !question.correctAnswer.includes(optionId);
  }, [showFeedback, selectedAnswers, question.correctAnswer]);

  // Determine if an option was correctly not selected
  const isCorrectlyNotSelected = useCallback((optionId: string) => {
    return showFeedback && 
      !selectedAnswers.includes(optionId) && 
      !question.correctAnswer.includes(optionId);
  }, [showFeedback, selectedAnswers, question.correctAnswer]);

  // Get the selection count message
  const getSelectionCountMessage = () => {
    if (!question.minSelections && !question.maxSelections) return null;
    
    const min = question.minSelections || 0;
    const max = question.maxSelections || question.options.length;
    
    if (min === max) {
      return `Select exactly ${min} ${min === 1 ? 'option' : 'options'}`;
    }
    
    if (min > 0 && max < question.options.length) {
      return `Select between ${min} and ${max} options`;
    }
    
    if (min > 0) {
      return `Select at least ${min} ${min === 1 ? 'option' : 'options'}`;
    }
    
    return `Select up to ${max} options`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selection count message */}
      {!showFeedback && (question.minSelections || question.maxSelections) && (
        <p className="text-sm text-gray-500 mb-2">
          {getSelectionCountMessage()}
        </p>
      )}
      
      <fieldset>
        <legend className="sr-only">Choose all that apply</legend>
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const optionId = `option-${index}`;
            const isChecked = selectedAnswers.includes(optionId);
            const isCorrectOption = isOptionCorrect(optionId);
            const isIncorrectOption = isOptionIncorrect(optionId);
            const isCorrectlyNotSelectedOption = isCorrectlyNotSelected(optionId);
            
            let optionClasses = 'relative flex items-start p-4 rounded-lg border transition-colors ';
            
            if (showFeedback) {
              if (isCorrectOption) {
                optionClasses += 'bg-green-50 border-green-200';
              } else if (isIncorrectOption) {
                optionClasses += 'bg-red-50 border-red-200';
              } else if (isCorrectlyNotSelectedOption) {
                optionClasses += 'bg-white border-gray-200';
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
                onClick={() => handleOptionToggle(optionId)}
              >
                <div className="flex items-center h-5">
                  <input
                    id={optionId}
                    name="answer"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleOptionToggle(optionId)}
                    className={`h-4 w-4 rounded ${
                      showFeedback 
                        ? isCorrectOption 
                          ? 'text-green-600 border-gray-300 focus:ring-green-500'
                          : isIncorrectOption
                            ? 'text-red-600 border-gray-300 focus:ring-red-500'
                            : 'text-blue-600 border-gray-300 focus:ring-blue-500'
                        : 'text-blue-600 border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={showFeedback || (
                      !isChecked && 
                      question.maxSelections && 
                      selectedAnswers.length >= question.maxSelections
                    )}
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
            disabled={!selectedAnswers.includes('other') || showFeedback}
            onChange={(e) => {
              if (!showFeedback) {
                const otherAnswers = selectedAnswers.filter(id => !id.startsWith('other:'));
                onChange([...otherAnswers, `other:${e.target.value}`]);
              }
            }}
            value={selectedAnswers.find(a => a.startsWith('other:'))?.split(':')[1] || ''}
          />
        </div>
      )}
      
      {/* Feedback message */}
      {showFeedback && question.correctAnswer.length > 1 && (
        <div className={`mt-4 p-3 rounded-md ${
          isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <p className="text-sm">
            {isCorrect 
              ? 'All correct answers selected! ' 
              : `Correct answers: ${question.correctAnswer.length} selected, ${selectedAnswers.length} correct.`}
            }
            {question.explanation && !isCorrect && (
              <span className="block mt-1">{question.explanation}</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default MultipleChoiceQuestion;

import React, { useState, useEffect, useRef } from 'react';
import { ShortAnswerQuestion } from '../types/question-types';

interface ShortAnswerQuestionProps {
  /** The question to display */
  question: ShortAnswerQuestion;
  /** The current answer value */
  answer: string;
  /** Callback when the answer changes */
  onChange: (answer: string) => void;
  /** Whether to show feedback on the answer */
  showFeedback?: boolean;
  /** Whether the answer is correct */
  isCorrect?: boolean;
  /** Optional class name for the container */
  className?: string;
}

/**
 * Renders a short answer question with a text input or textarea
 */
const ShortAnswerQuestion: React.FC<ShortAnswerQuestionProps> = ({
  question,
  answer,
  onChange,
  showFeedback = false,
  isCorrect,
  className = '',
}) => {
  const [localAnswer, setLocalAnswer] = useState(answer || '');
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const isTextarea = question.multiline ?? false;
  const rows = question.rows ?? 4;
  const maxLength = question.maxLength || (isTextarea ? 1000 : 200);
  const minLength = question.minLength || 0;
  
  // Update local state when answer prop changes
  useEffect(() => {
    setLocalAnswer(answer || '');
  }, [answer]);

  // Validate the answer
  const validateAnswer = (value: string) => {
    if (showFeedback) return true; // Skip validation after submission
    
    let isValid = true;
    let error = '';
    
    // Check required
    if (question.required && !value.trim()) {
      isValid = false;
      error = 'This field is required';
    }
    // Check min length
    else if (value.length > 0 && value.length < minLength) {
      isValid = false;
      error = `Answer must be at least ${minLength} characters`;
    }
    // Check max length
    else if (value.length > maxLength) {
      isValid = false;
      error = `Answer must be ${maxLength} characters or less`;
    }
    // Check pattern if provided
    else if (question.pattern) {
      const regex = new RegExp(question.pattern);
      if (!regex.test(value)) {
        isValid = false;
        error = question.patternError || 'Invalid format';
      }
    }
    
    setIsValid(isValid);
    setValidationError(error);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (showFeedback) return; // Don't allow changes after submission
    
    let value = e.target.value;
    if (!question.caseSensitive) {
      value = value.toLowerCase();
    }
    if (question.trimWhitespace) {
      value = value.trim();
    }
    
    setLocalAnswer(value);
    validateAnswer(value);
    
    // Only call onChange if the value is valid or empty (to allow clearing the field)
    if (validateAnswer(value) || value === '') {
      onChange(value);
    }
  };

  const handleBlur = () => {
    if (question.trimWhitespace) {
      const trimmedValue = localAnswer.trim();
      setLocalAnswer(trimmedValue);
      if (validateAnswer(trimmedValue)) {
        onChange(trimmedValue);
      }
    }
  };

  // Check if the answer is correct (for feedback)
  const isAnswerCorrect = (userAnswer: string, correctAnswer: string | string[]): boolean => {
    if (!showFeedback) return false;
    
    if (Array.isArray(correctAnswer)) {
      return correctAnswer.some(correct => 
        question.caseSensitive 
          ? userAnswer === correct
          : userAnswer.toLowerCase() === correct.toLowerCase()
      );
    }
    
    return question.caseSensitive
      ? userAnswer === correctAnswer
      : userAnswer.toLowerCase() === correctAnswer.toLowerCase();
  };

  // Determine if we should show feedback
  const showFeedbackState = showFeedback && (answer !== undefined && answer !== null && answer !== '');
  const isCorrectAnswer = showFeedbackState && isAnswerCorrect(answer, question.correctAnswer);
  const isIncorrectAnswer = showFeedbackState && !isCorrectAnswer;

  // Get the correct answer for display (if needed)
  const getCorrectAnswerText = () => {
    if (!showFeedbackState || isCorrectAnswer) return null;
    
    if (Array.isArray(question.correctAnswer)) {
      return `Possible correct answers: ${question.correctAnswer.join(', ')}`;
    }
    
    return `Correct answer: ${question.correctAnswer}`;
  };

  const inputProps = {
    ref: inputRef as any,
    value: localAnswer,
    onChange: handleChange,
    onBlur: handleBlur,
    disabled: showFeedback,
    maxLength: maxLength,
    minLength: minLength,
    placeholder: question.placeholder || (isTextarea ? 'Type your answer here...' : 'Enter your answer...'),
    className: `block w-full rounded-md shadow-sm ${
      showFeedback
        ? isCorrectAnswer
          ? 'border-green-300 bg-green-50 text-green-900 focus:ring-green-500 focus:border-green-500'
          : isIncorrectAnswer
            ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 bg-gray-50 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
        : !isValid
          ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
          : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
    } sm:text-sm`,
    'aria-invalid': !isValid ? 'true' : 'false',
    'aria-describedby': !isValid ? `${question.id}-error` : undefined,
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        {isTextarea ? (
          <textarea
            {...inputProps as any}
            rows={rows}
            className={`${inputProps.className} resize-y`}
          />
        ) : (
          <input
            {...inputProps as any}
            type="text"
            className={`${inputProps.className} h-10`}
          />
        )}
        
        {/* Character counter */}
        {maxLength && (
          <div className="mt-1 text-right text-xs text-gray-500">
            {localAnswer.length}/{maxLength} characters
          </div>
        )}
        
        {/* Validation error */}
        {!isValid && (
          <p className="mt-1 text-sm text-red-600" id={`${question.id}-error`}>
            {validationError}
          </p>
        )}
      </div>

      {/* Feedback */}
      {showFeedbackState && (
        <div className={`mt-3 p-3 rounded-md ${
          isCorrectAnswer 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {isCorrectAnswer ? (
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 0L6 8.586 4.707 7.293a1 1 0 00-1.414 1.414L4.586 10l-1.293 1.293a1 1 0 101.414 1.414L6 11.414l1.293 1.293a1 1 0 001.414-1.414L7.414 10l1.293-1.293a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                isCorrectAnswer ? 'text-green-800' : 'text-red-800'
              }`}>
                {isCorrectAnswer ? 'Correct!' : 'Incorrect'}
              </h3>
              <div className="mt-1 text-sm">
                {isIncorrectAnswer && getCorrectAnswerText() && (
                  <p className="text-sm">{getCorrectAnswerText()}</p>
                )}
                {question.explanation && (
                  <p className="mt-1">{question.explanation}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortAnswerQuestion;

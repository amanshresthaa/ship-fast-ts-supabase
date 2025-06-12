import React from 'react';
import { useQuiz } from '../hooks/useQuiz';
import { formatTime } from '../utils/formatting';

interface QuizHeaderProps {
  title: string;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  onPause?: () => void;
  className?: string;
}

/**
 * QuizHeader Component
 * Displays the quiz title, progress, and timer
 * Handles the pause/resume functionality
 */
const QuizHeader: React.FC<QuizHeaderProps> = ({
  title,
  questionNumber,
  totalQuestions,
  timeRemaining,
  onPause,
  className = '',
}) => {
  const { isPaused, togglePause } = useQuiz();

  const handlePauseClick = () => {
    if (onPause) {
      onPause();
    } else {
      togglePause();
    }
  };

  return (
    <header className={`quiz-header bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Quiz Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 truncate">
              {title}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Question {questionNumber} of {totalQuestions}
            </p>
          </div>

          {/* Timer and Controls */}
          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="ml-2 text-sm font-medium text-gray-900">
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* Pause/Resume Button */}
            <button
              type="button"
              onClick={handlePauseClick}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isPaused ? (
                <>
                  <svg
                    className="-ml-0.5 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Resume
                </>
              ) : (
                <>
                  <svg
                    className="-ml-0.5 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Pause
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-100">
        <div 
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
        />
      </div>
    </header>
  );
};

export default QuizHeader;

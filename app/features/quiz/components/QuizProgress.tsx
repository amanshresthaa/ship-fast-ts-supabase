import React from 'react';
import { formatPercentage } from '../utils/formatting';

interface QuizProgressProps {
  /** Zero-based index of the current question */
  currentIndex: number;
  /** Total number of questions in the quiz */
  totalQuestions: number;
  /** Number of questions that have been attempted (optional) */
  attemptedQuestions?: number;
  /** Custom class name for the container */
  className?: string;
  /** Show/hide the attempt count */
  showAttemptCount?: boolean;
  /** Show/hide the percentage */
  showPercentage?: boolean;
  /** Custom label for the progress bar (accessible name) */
  ariaLabel?: string;
}

/**
 * Displays a progress bar showing the user's progress through the quiz.
 * Shows the current question number, total questions, and optional attempt count.
 * Includes an animated progress bar with shimmer effect.
 */
const QuizProgress: React.FC<QuizProgressProps> = ({
  currentIndex,
  totalQuestions,
  attemptedQuestions,
  className = '',
  showAttemptCount = true,
  showPercentage = true,
  ariaLabel = 'Quiz progress',
}) => {
  // Calculate display values
  const currentQuestionNumber = Math.min(currentIndex + 1, totalQuestions);
  const questionsForProgress = attemptedQuestions !== undefined 
    ? attemptedQuestions 
    : currentQuestionNumber;
  
  const progressPercentage = totalQuestions > 0
    ? Math.min(100, (questionsForProgress / totalQuestions) * 100)
    : 0;

  const percentageRemaining = 100 - progressPercentage;
  const isComplete = progressPercentage >= 100;
  const hasAttempts = attemptedQuestions !== undefined;

  // Generate accessible progress text
  const progressText = isComplete
    ? 'Quiz completed!'
    : `Question ${currentQuestionNumber} of ${totalQuestions}`;

  return (
    <section 
      className={`quiz-progress w-full max-w-3xl mx-auto my-6 ${className}`}
      aria-label={ariaLabel}
    >
      {/* Progress Info */}
      <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
        <div 
          className="bg-blue-600 text-white py-1.5 px-4 rounded-full shadow-md text-sm font-medium"
          aria-current="step"
        >
          {progressText}
        </div>
        
        <div className="flex flex-col items-end gap-1">
          {showPercentage && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {isComplete 
                ? 'Completed!' 
                : `${percentageRemaining.toFixed(0)}% remaining`}
            </div>
          )}
          
          {showAttemptCount && hasAttempts && (
            <div 
              className="text-xs text-gray-500 dark:text-gray-400"
              aria-live="polite"
            >
              {attemptedQuestions} of {totalQuestions} {attemptedQuestions === 1 ? 'question' : 'questions'} attempted
            </div>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div 
        className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner"
        role="progressbar"
        aria-valuenow={Math.round(progressPercentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${Math.round(progressPercentage)}% complete`}
      >
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
          style={{ width: `${progressPercentage}%` }}
        >
          {/* Animated shimmer effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-30"
            style={{
              animation: 'shimmer 2s infinite',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      </div>
      
      {/* Animation keyframes for the shimmer effect */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  );
};

export default QuizProgress;

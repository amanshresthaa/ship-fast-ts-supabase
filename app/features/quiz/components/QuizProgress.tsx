import React from 'react';

interface QuizProgressProps {
  currentIndex: number; // 0-indexed
  totalQuestions: number;
  attemptedQuestions?: number; // Number of questions that have been attempted
}

const QuizProgress: React.FC<QuizProgressProps> = ({ 
  currentIndex, 
  totalQuestions, 
  attemptedQuestions 
}) => {
  // Use attempted questions for progress calculation if provided, otherwise fall back to current index
  const questionsForProgress = attemptedQuestions !== undefined ? attemptedQuestions : Math.min(currentIndex + 1, totalQuestions);
  const currentQuestionDisplay = Math.min(currentIndex + 1, totalQuestions);
  
  const displayProgressPercentage = totalQuestions > 0
    ? (questionsForProgress / totalQuestions) * 100
    : 0;

  // Calculate raw percentage left for display, ensuring it's a whole number
  const displayPercentageLeft = (100 - displayProgressPercentage).toFixed(0);

  return (
    <div className="progress-container relative my-6 mx-auto w-full max-w-xl">
      <div className="progress-info flex justify-between items-center mb-3 font-medium text-sm">
        <div className="question-counter bg-primary-gradient text-white py-2 px-4 rounded-full shadow-md text-xs sm:text-sm font-semibold">
          Question {currentQuestionDisplay} of {totalQuestions}
        </div>
        <div className="flex flex-col items-end">
          <div className="percentage-left-text text-custom-gray-2 dark:text-gray-400 py-1 px-3 text-xs sm:text-sm">
            {totalQuestions === 0 ? "No questions" : (displayProgressPercentage >= 100 ? "Completed!" : `${displayPercentageLeft}% left`)}
          </div>
          {attemptedQuestions !== undefined && (
            <div className="text-xs text-custom-gray-3 dark:text-gray-500">
              {attemptedQuestions} of {totalQuestions} attempted
            </div>
          )}
        </div>
      </div>
      
      <div className="progress-bar h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
        <div 
          className="progress-fill h-full bg-primary-gradient rounded-full transition-all duration-700 ease-out shadow-sm relative overflow-hidden"
          style={{ width: `${displayProgressPercentage}%` }}
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
};

export default QuizProgress;

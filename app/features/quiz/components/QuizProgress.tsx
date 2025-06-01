import React from 'react';

interface QuizProgressProps {
  currentIndex: number; // 0-indexed
  totalQuestions: number;
}

const QuizProgress: React.FC<QuizProgressProps> = ({ currentIndex, totalQuestions }) => {
  // currentQuestionDisplay: if currentIndex >= totalQuestions, show totalQuestions. Else currentIndex + 1.
  const currentQuestionDisplay = Math.min(currentIndex + 1, totalQuestions);
  
  const displayProgressPercentage = totalQuestions > 0
    ? (currentQuestionDisplay / totalQuestions) * 100
    : 0;

  // Calculate raw percentage left for display, ensuring it's a whole number
  const displayPercentageLeft = (100 - displayProgressPercentage).toFixed(0);

  return (
    <div className="progress-container relative my-8 mx-auto w-full max-w-xl">
      <div className="progress-info flex justify-between items-center mb-2 font-medium text-sm">
        <div className="question-counter bg-primary-gradient text-white py-1 px-3 rounded-full shadow-md text-xs md:text-sm">
          Question {currentQuestionDisplay} of {totalQuestions}
        </div>
        <div className="percentage-left-text text-gray-600 dark:text-gray-400 py-1 px-3 text-xs md:text-sm">
          {totalQuestions === 0 ? "No questions" : (displayProgressPercentage >= 100 ? "Completed!" : `${displayPercentageLeft}% left`)}
        </div>
      </div>
      
      <div className="progress-bar h-3 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
        <div 
          className="progress-fill h-full bg-primary-gradient rounded-full transition-all duration-500 ease-out shadow"
          style={{ width: `${displayProgressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default QuizProgress;

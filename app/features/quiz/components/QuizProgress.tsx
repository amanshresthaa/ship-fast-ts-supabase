import React from 'react';

interface QuizProgressProps {
  currentIndex: number;
  totalQuestions: number;
}

const QuizProgress: React.FC<QuizProgressProps> = ({ currentIndex, totalQuestions }) => {
  const progressPercentage = totalQuestions > 0 
    ? ((currentIndex + 1) / totalQuestions) * 100 
    : 0;

  return (
    <div className="progress-container relative my-8 mx-auto w-full max-w-xl">
      <div className="progress-info flex justify-between mb-2 font-medium text-sm">
        <div className="question-counter bg-primary-gradient text-white py-1 px-4 rounded-rounded-full shadow-shadow-1 text-xs md:text-sm">
          Question {currentIndex + 1} of {totalQuestions}
        </div>
      </div>
      
      <div className="progress-bar h-2 bg-gray-200 rounded-rounded-full overflow-hidden shadow-inner">
        <div 
          className="progress-fill h-full bg-primary-gradient rounded-rounded-full transition-all duration-300 ease-out shadow-md"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default QuizProgress;

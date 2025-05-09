import React from 'react';
import { useQuiz } from '../context/QuizContext';

interface QuizNavigationProps {
  currentQuestionId: string;
}

const QuizNavigation: React.FC<QuizNavigationProps> = ({ currentQuestionId }) => {
  const { state, dispatch } = useQuiz();
  
  const isLastQuestion = state.currentQuestionIndex === state.questions.length - 1;
  const isFirstQuestion = state.currentQuestionIndex === 0;
  const hasAnsweredCurrent = !!state.userAnswers[currentQuestionId]; 

  // Button styles
  const btnBase = "inline-flex items-center justify-center px-8 h-12 border-none rounded-rounded-full font-semibold text-base cursor-pointer transition-all duration-200 relative overflow-hidden";
  const btnSecondaryCustom = `${btnBase} bg-gray-100 text-custom-gray-1 hover:bg-gray-200 hover:-translate-y-0.5`;
  const btnPrimaryCustom = `${btnBase} bg-primary-gradient text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5`;

  const handleNext = () => {
    if (isLastQuestion) {
      if (hasAnsweredCurrent) {
        dispatch({ type: 'COMPLETE_QUIZ' });
      } else {
        alert("Please submit your answer before finishing the quiz.");
      }
    } else {
      dispatch({ type: 'NEXT_QUESTION' });
    }
  };

  const handlePrevious = () => {
    dispatch({ type: 'PREVIOUS_QUESTION' });
  };

  return (
    <div className="navigation flex flex-col md:flex-row justify-between mt-10 gap-4">
      <button 
        onClick={handlePrevious}
        disabled={isFirstQuestion}
        className={`${btnSecondaryCustom} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 w-full md:w-auto`}
      >
        Previous
      </button>
      
      <button 
        onClick={handleNext}
        disabled={isLastQuestion && !hasAnsweredCurrent}
        className={`${btnPrimaryCustom} disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 w-full md:w-auto`}
      >
        {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
        
        {/* Icon for next button */}
        {!isLastQuestion && 
          <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" fill="currentColor"/>
          </svg>
        }
      </button>
    </div>
  );
};

export default QuizNavigation;

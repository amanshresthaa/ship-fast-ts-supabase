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

  // Button styles with better mobile support
  const btnBase = "inline-flex items-center justify-center px-4 sm:px-8 h-10 sm:h-12 border-none rounded-full font-semibold text-sm sm:text-base cursor-pointer transition-all duration-200 relative overflow-hidden min-w-0";
  const btnSecondaryCustom = `${btnBase} bg-gradient-to-r from-gray-100 to-gray-200 text-custom-gray-1 hover:from-gray-200 hover:to-gray-300 hover:-translate-y-0.5 shadow-sm`;
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
    <div className="navigation flex flex-row justify-center sm:justify-between gap-3 sm:gap-4 w-full">
      <button 
        onClick={handlePrevious}
        disabled={isFirstQuestion}
        className={`${btnSecondaryCustom} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex-1 sm:flex-none max-w-32 sm:max-w-none`}
      >
        <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Previous</span>
        <span className="sm:hidden">Prev</span>
      </button>
      
      <button 
        onClick={handleNext}
        disabled={isLastQuestion && !hasAnsweredCurrent}
        className={`${btnPrimaryCustom} disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex-1 sm:flex-none max-w-40 sm:max-w-none`}
      >
        <span className="truncate">
          {isLastQuestion ? 'Finish' : 'Next'}
        </span>
        
        {/* Icon for next button */}
        {!isLastQuestion && 
          <svg className="ml-1 sm:ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" fill="currentColor"/>
          </svg>
        }
        
        {isLastQuestion && 
          <svg className="ml-1 sm:ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        }
      </button>
    </div>
  );
};

export default QuizNavigation;

import React from 'react';
import { useQuiz } from '../context/QuizContext';
import QuizNavigation from './QuizNavigation';

interface QuizFooterProps {
  currentQuestionId: string;
}

const QuizFooter: React.FC<QuizFooterProps> = ({ currentQuestionId }) => {
  const { state, dispatch } = useQuiz();
  
  const handleSubmitQuiz = () => {
    const totalQuestions = state.questions.length;
    const answeredQuestions = Object.keys(state.userAnswers).length;
    
    if (answeredQuestions === 0) {
      alert("You haven't answered any questions yet. Please answer at least one question before submitting.");
      return;
    }
    
    const confirmMessage = answeredQuestions < totalQuestions 
      ? `You have answered ${answeredQuestions} out of ${totalQuestions} questions. Are you sure you want to submit the quiz?`
      : "Are you sure you want to submit the quiz?";
      
    if (confirm(confirmMessage)) {
      dispatch({ type: 'COMPLETE_QUIZ' });
    }
  };

  const handleHelp = () => {
    // You can implement a help modal or redirect to help page
    alert("Help feature coming soon! For now, use the resources in the sidebar.");
  };

  return (
    <footer className="bg-white dark:bg-gray-900 p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="flex flex-col sm:flex-row items-center justify-between max-w-full mx-auto gap-3 sm:gap-4">
        {/* Mobile: Stack vertically, Desktop: Three columns */}
        
        {/* Zoom Controls - Hidden on mobile */}
        <div className="hidden sm:flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4 text-custom-gray-2 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
          <span className="text-sm text-custom-gray-2 dark:text-gray-300 font-medium">100%</span>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4 text-custom-gray-2 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
        </div>

        {/* Navigation - Full width on mobile, centered on desktop */}
        <div className="w-full sm:w-auto order-1 sm:order-2">
          <QuizNavigation currentQuestionId={currentQuestionId} />
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-3 order-2 sm:order-3">
          <button 
            onClick={handleHelp}
            className="text-sm text-custom-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
          >
            Help
          </button>
          <button 
            onClick={handleSubmitQuiz}
            className="px-4 py-2 bg-gradient-to-r from-custom-success to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Submit Quiz
          </button>
          {/* Dark Mode Toggle - Hidden on mobile for space */}
          <button className="hidden sm:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4 text-custom-gray-2 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default QuizFooter;

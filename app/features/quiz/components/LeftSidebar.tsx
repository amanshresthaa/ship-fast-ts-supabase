import React, { useState, useEffect } from 'react';
import { useQuiz } from '../context/QuizContext';
import Link from 'next/link';

interface LeftSidebarProps {
  quizId: string;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ quizId }) => {
  const { state, dispatch } = useQuiz();
  const [timeLeft, setTimeLeft] = useState<string>('--:--');
  
  // Timer logic - for demo purposes, starting with 60 minutes
  useEffect(() => {
    const startTime = Date.now();
    const duration = 60 * 60 * 1000; // 60 minutes in milliseconds
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      
      if (remaining === 0) {
        setTimeLeft('00:00');
        clearInterval(timer);
        return;
      }
      
      const minutes = Math.floor(remaining / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  if (!state.quiz) return null;
  
  // Calculate quiz statistics based on attempted questions
  const totalQuestions = state.questions.length;
  const attemptedQuestions = Object.keys(state.userAnswers).length;
  const completionPercentage = totalQuestions > 0 ? Math.round((attemptedQuestions / totalQuestions) * 100) : 0;
  
  // Get difficulty distribution
  const difficultyCount = state.questions.reduce((acc, question) => {
    acc[question.difficulty] = (acc[question.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Get total points
  const totalPoints = state.questions.reduce((sum, question) => sum + question.points, 0);
  
  // Navigation handler for question map
  const handleQuestionClick = (questionIndex: number) => {
    dispatch({ type: 'NAVIGATE_TO_QUESTION', payload: questionIndex });
  };
  return (
    <aside className="w-full h-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto border-r border-gray-200 dark:border-gray-700">
      {/* Quiz Summary Section */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-custom-dark-blue dark:text-white">Quiz Summary</h2>
        
        <div className="space-y-3 sm:space-y-4">
          {/* Time Left */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border-l-4 border-custom-error shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-custom-error" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" clipRule="evenodd" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-custom-error dark:text-red-300">Time Left:</span>
            </div>
            <span className="text-lg font-bold text-custom-error dark:text-red-400">{timeLeft}</span>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border-l-4 border-custom-primary shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-custom-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-custom-primary dark:text-blue-300">Progress:</span>
            </div>
            <span className="text-lg font-bold text-custom-primary dark:text-blue-400">{completionPercentage}%</span>
          </div>

          {/* Points */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border-l-4 border-yellow-500 shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-yellow-700 dark:text-yellow-300">Points:</span>
            </div>
            <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{totalPoints}</span>
          </div>

          {/* Difficulty Badges */}
          <div className="space-y-2">
            <span className="text-xs sm:text-sm font-medium text-custom-gray-1 dark:text-gray-300">Difficulty:</span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {Object.entries(difficultyCount).map(([difficulty, count]) => (
                <div 
                  key={difficulty}
                  className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                    difficulty === 'easy' ? 'bg-gradient-to-r from-green-100 to-green-200 text-custom-success dark:from-green-900/30 dark:to-green-800/30 dark:text-green-300' :
                    difficulty === 'medium' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 dark:from-yellow-900/30 dark:to-yellow-800/30 dark:text-yellow-300' :
                    'bg-gradient-to-r from-red-100 to-red-200 text-custom-error dark:from-red-900/30 dark:to-red-800/30 dark:text-red-300'
                  }`}
                >
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}: {count}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Question Map Section */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-custom-dark-blue dark:text-white">Question Map</h2>
        
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 sm:gap-2">
          {state.questions.map((question, index) => {
            const isAnswered = !!state.userAnswers[question.id];
            const isCurrent = index === state.currentQuestionIndex;
            const isCorrect = state.userAnswers[question.id]?.isCorrect;
            
            return (
              <button
                key={question.id}
                onClick={() => handleQuestionClick(index)}
                className={`
                  flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 shadow-sm
                  ${isCurrent 
                    ? 'bg-primary-gradient text-white shadow-lg ring-2 ring-blue-300' 
                    : isAnswered
                      ? isCorrect 
                        ? 'bg-success-gradient text-white hover:shadow-md' 
                        : 'bg-error-gradient text-white hover:shadow-md'
                      : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 text-custom-gray-1 dark:text-gray-300 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-500 dark:hover:to-gray-600'
                  }
                `}
                title={`Question ${index + 1} - ${isAnswered ? (isCorrect ? 'Correct' : 'Incorrect') : 'Not answered'}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-primary-gradient rounded"></div>
            <span className="text-custom-gray-2 dark:text-gray-400">Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-success-gradient rounded"></div>
            <span className="text-custom-gray-2 dark:text-gray-400">Correct</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-error-gradient rounded"></div>
            <span className="text-custom-gray-2 dark:text-gray-400">Incorrect</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded"></div>
            <span className="text-custom-gray-2 dark:text-gray-400">Unanswered</span>
          </div>
        </div>
      </div>

      {/* Resources Section */}
      <div className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4 text-custom-dark-blue dark:text-white">Resources</h2>
        
        <div className="space-y-1.5 sm:space-y-2">
          <Link 
            href="#" 
            className="flex items-center gap-3 p-3 rounded-xl text-custom-gray-1 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 transition-all duration-200 group"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-custom-primary group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Study Guide</span>
          </Link>
          
          <Link 
            href="#" 
            className="flex items-center gap-3 p-3 rounded-xl text-custom-gray-1 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 dark:hover:from-purple-900/20 dark:hover:to-purple-800/20 transition-all duration-200 group"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Quiz Rules</span>
          </Link>
          
          <Link 
            href="#" 
            className="flex items-center gap-3 p-3 rounded-xl text-custom-gray-1 dark:text-gray-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 dark:hover:from-green-900/20 dark:hover:to-green-800/20 transition-all duration-200 group"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-custom-success group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C17.759 8.071 18 9.009 18 10zm-9.615 3.615L7 12.229a4.001 4.001 0 105.464-.764l-2.049 2.05zM10 6a4 4 0 00-3.464 6.036L8 10.586a1 1 0 011.414 0L12 13.172A4 4 0 0010 6z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Help & Support</span>
          </Link>
          
          <Link 
            href="#" 
            className="flex items-center gap-3 p-3 rounded-xl text-custom-gray-1 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 transition-all duration-200 group"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-custom-gray-2 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;

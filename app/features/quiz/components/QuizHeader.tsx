import React, { useState } from 'react';
import Link from 'next/link';
import { useQuiz } from '../context/QuizContext';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import QuizProgress from './QuizProgress';
import { availableQuestionTypes } from '../pages/QuizPage';

interface QuizHeaderProps {
  quizId: string;
  user?: any;
  effectiveQuestionTypes?: string[];
  effectiveQuestionType?: string;
  showQuestionFilters?: boolean;
  showBackButton?: boolean;
  customActions?: React.ReactNode;
}

const QuizHeader: React.FC<QuizHeaderProps> = ({
  quizId,
  user,
  effectiveQuestionTypes,
  effectiveQuestionType,
  showQuestionFilters = true,
  showBackButton = true,
  customActions
}) => {
  const { state } = useQuiz();
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  if (!state.quiz) return null;

  // Calculate quiz statistics
  const totalQuestions = state.questions.length;
  const answeredQuestions = Object.keys(state.userAnswers).length;
  const completionPercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  
  // Get quiz difficulty distribution
  const difficultyCount = state.questions.reduce((acc, question) => {
    acc[question.difficulty] = (acc[question.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get total points
  const totalPoints = state.questions.reduce((sum, question) => sum + question.points, 0);

  return (
    <header className="quiz-header bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
      {/* Main Header Section */}
      <div className="header-main bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 px-6 py-6">
        <div className="flex items-start justify-between mb-4">
          {/* Title and Back Button */}
          <div className="flex items-center gap-4 flex-1">
            {showBackButton && (
              <Link 
                href="/quizzes"
                className="back-button flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Quizzes
              </Link>
            )}
            
            <div className="quiz-title-section flex-1">
              <h1 className="quiz-title text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                {state.quiz.title}
                <span className="title-accent block w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-2"></span>
              </h1>
              
              {/* Quiz Metadata */}
              <div className="quiz-metadata flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="metadata-item flex items-center gap-1.5 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-full shadow-sm">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm8 0a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1v-6z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{totalQuestions}</span>
                  <span>Questions</span>
                </div>
                
                <div className="metadata-item flex items-center gap-1.5 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-full shadow-sm">
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-medium">{totalPoints}</span>
                  <span>Points</span>
                </div>
                
                <div className="metadata-item flex items-center gap-1.5 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-full shadow-sm">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{completionPercentage}%</span>
                  <span>Complete</span>
                </div>
                
                {/* Difficulty Distribution */}
                {Object.keys(difficultyCount).length > 0 && (
                  <div className="difficulty-distribution flex items-center gap-2">
                    {Object.entries(difficultyCount).map(([difficulty, count]) => (
                      <div 
                        key={difficulty}
                        className={`difficulty-badge px-2 py-1 rounded-full text-xs font-medium ${
                          difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}
                      >
                        {difficulty}: {count}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="header-actions flex items-center gap-3">
            {customActions}
            {user && <SaveStatusIndicator />}
          </div>
        </div>

        {/* Progress Section */}
        <div className="progress-section">
          <QuizProgress 
            currentIndex={state.currentQuestionIndex} 
            totalQuestions={totalQuestions}
            attemptedQuestions={Object.keys(state.userAnswers).length}
          />
        </div>
      </div>

      {/* Question Type Filters */}
      {showQuestionFilters && (
        <div className="filters-section bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Question Types
            </h3>
            <button
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="expand-button flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <span>{isFiltersExpanded ? 'Show Less' : 'Show All'}</span>
              <svg 
                className={`w-3 h-3 transition-transform ${isFiltersExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          <div className={`filter-buttons flex flex-wrap gap-2 transition-all duration-300 ${
            isFiltersExpanded ? 'max-h-none' : 'max-h-10 overflow-hidden'
          }`}>
            {/* All Questions Filter */}
            <Link 
              href={`/quiz/${quizId}`} 
              className={`filter-button px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 ${
                !effectiveQuestionTypes || effectiveQuestionTypes.length > 1 
                  ? 'bg-blue-500 text-white shadow-md hover:shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm8 0a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1v-6z" clipRule="evenodd" />
                </svg>
                All Questions
              </span>
            </Link>
            
            {/* Individual Question Type Filters */}
            {availableQuestionTypes.map(({ type, name }) => {
              const isActive = effectiveQuestionType === type;
              const questionCount = state.questions.filter(q => q.type === type).length;
              
              return (
                <Link 
                  key={type}
                  href={`/quiz/${quizId}/type/${type}`}
                  className={`filter-button px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    isActive 
                      ? 'bg-blue-500 text-white shadow-md hover:shadow-lg' 
                      : questionCount > 0
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {name}
                    {questionCount > 0 && (
                      <span className={`question-count px-1.5 py-0.5 text-xs rounded-full ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                      }`}>
                        {questionCount}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default QuizHeader;

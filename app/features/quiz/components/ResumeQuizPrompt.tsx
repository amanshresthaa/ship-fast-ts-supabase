import React from 'react';

interface ResumeQuizPromptProps {
  lastSavedAt: Date;
  currentQuestionIndex: number;
  totalQuestions: number;
  onResume: () => void;
  onRestart: () => void;
}

/**
 * A UI component that shows a prompt to resume a previously started quiz
 * or start fresh from the beginning.
 */
export const ResumeQuizPrompt = ({
  lastSavedAt, 
  currentQuestionIndex, 
  totalQuestions, 
  onResume, 
  onRestart
}: ResumeQuizPromptProps) => {
  const progressPercentage = Math.round((currentQuestionIndex / totalQuestions) * 100);
  const formattedDate = lastSavedAt.toLocaleString();
  
  return (
    <div className="mx-auto max-w-md p-4 space-y-6">
      <div className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
            Welcome back!
          </h3>
        </div>
        <p className="mt-2 text-blue-600 dark:text-blue-300">
          You have a quiz in progress. Would you like to resume where you left off?
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last activity: {formattedDate}
          </p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 rounded-full h-2" 
                style={{ width: `${progressPercentage}%` }} 
              />
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50"
          onClick={onRestart}
        >
          <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Start Fresh
        </button>
        
        <button 
          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md flex items-center justify-center hover:bg-blue-700"
          onClick={onResume}
        >
          <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          Continue
        </button>
      </div>
    </div>
  );
};
import { useQuiz } from '../context/QuizContext';
import React from 'react';

/**
 * A component that shows the current progress saving status
 * with appropriate icons and tooltips.
 */
export const SaveStatusIndicator: React.FC = () => {
  const { state } = useQuiz();
  const { isSavingProgress, progressError } = state;
  
  // Determine what to show based on the current state
  let icon = null;
  let label = '';
  let tooltipContent = '';
  let statusClass = '';
  
  if (progressError) {
    icon = (
      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
    label = 'Error';
    tooltipContent = `Failed to save progress: ${progressError}`;
    statusClass = 'text-red-500';
  } else if (isSavingProgress) {
    icon = (
      <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    );
    label = 'Saving';
    tooltipContent = 'Your progress is being saved...';
    statusClass = 'text-yellow-500';
  } else {
    icon = (
      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
    label = 'Saved';
    tooltipContent = 'Your progress has been saved';
    statusClass = 'text-green-500';
  }

  return (
    <div className="relative group">
      <div className={`flex items-center gap-1.5 text-xs ${statusClass} cursor-help`}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-2 text-sm bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
        {tooltipContent}
      </div>
    </div>
  );
};
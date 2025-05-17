'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the QuizFeedbackModal component
// This implements code splitting so this component is only loaded when needed
const DynamicQuizFeedbackModal = dynamic(
  () => import('./QuizFeedbackModal'),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-6 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-4 bg-gray-200 rounded col-span-2"></div>
                  <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    ssr: false, // This component doesn't need server-side rendering
  }
);

interface DynamicModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  score: {
    correct: number;
    total: number;
    percentage: number;
  };
  timeSpent: string;
  passingPercentage?: number;
}

/**
 * DynamicModalWrapper - Handles loading state and dynamic import of QuizFeedbackModal
 * Implements code splitting pattern from the performance checklist
 */
const DynamicModalWrapper: React.FC<DynamicModalWrapperProps> = ({
  isOpen,
  onClose,
  score,
  timeSpent,
  passingPercentage = 70,
}) => {
  // Track if the component should be loaded
  const [shouldLoad, setShouldLoad] = useState(false);
  
  // Determine if the user passed based on their percentage
  const isPassing = score.percentage >= passingPercentage;
  
  useEffect(() => {
    // Only load the modal component if it's going to be shown
    // This prevents unnecessary loading when the modal is closed
    if (isOpen && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [isOpen, shouldLoad]);
  
  // Don't render anything until the modal should be shown
  if (!shouldLoad) return null;
  
  return (
    <Suspense fallback={<div>Loading results...</div>}>
      <DynamicQuizFeedbackModal
        isOpen={isOpen}
        onClose={onClose}
        score={score}
        timeSpent={timeSpent}
        isPassing={isPassing}
      />
    </Suspense>
  );
};

export default DynamicModalWrapper;

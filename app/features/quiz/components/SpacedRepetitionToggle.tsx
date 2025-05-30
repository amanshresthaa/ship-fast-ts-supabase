'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SpacedRepetitionToggleProps {
  quizId: string;
  questionType?: string;
  className?: string;
}

export default function SpacedRepetitionToggle({ 
  quizId, 
  questionType, 
  className = '' 
}: SpacedRepetitionToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSpacedRepetitionMode = searchParams.get('spacedRepetition') === 'true';

  const toggleMode = () => {
    const params = new URLSearchParams();
    
    // Add question type if present
    if (questionType) {
      params.set('questionType', questionType);
    }
    
    // Toggle spaced repetition mode
    if (!isSpacedRepetitionMode) {
      params.set('spacedRepetition', 'true');
    }
    
    // Build new URL
    const newUrl = `/quiz/${quizId}${params.toString() ? '?' + params.toString() : ''}`;
    router.push(newUrl);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
      isSpacedRepetitionMode ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'
    } ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">
            {isSpacedRepetitionMode ? '🧠' : '📝'}
          </span>
          <div>
            <h3 className="font-semibold text-gray-800">
              {isSpacedRepetitionMode ? 'Smart Learning Mode' : 'Regular Quiz Mode'}
            </h3>
            <p className="text-sm text-gray-600">
              {isSpacedRepetitionMode 
                ? 'Using SM-2 algorithm for adaptive learning'
                : 'Standard quiz experience'
              }
            </p>
          </div>
        </div>
        
        <button
          onClick={toggleMode}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isSpacedRepetitionMode
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isSpacedRepetitionMode ? 'Switch to Regular' : 'Enable Smart Learning'}
        </button>
      </div>
      
      {isSpacedRepetitionMode && (
        <div className="mt-3 p-3 bg-green-100 rounded-md">
          <div className="text-xs text-green-800">
            <strong>Active Features:</strong>
            <div className="mt-1 grid grid-cols-2 gap-1">
              <span>✓ Adaptive difficulty</span>
              <span>✓ Performance tracking</span>
              <span>✓ SM-2 algorithm</span>
              <span>✓ Long-term retention</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CorrectIcon, IncorrectIcon } from './question-types/FeedbackIcons';

interface QuizFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: {
    correct: number;
    total: number;
    percentage: number;
  };
  timeSpent: string;
  isPassing: boolean;
}

/**
 * QuizFeedbackModal - Shows detailed quiz results in a modal overlay
 * This is a good candidate for dynamic importing since it's only shown at the end of a quiz
 */
const QuizFeedbackModal: React.FC<QuizFeedbackModalProps> = ({
  isOpen,
  onClose,
  score,
  timeSpent,
  isPassing
}) => {
  if (!isOpen) return null;
  
  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="text-center mb-6">
          <div className="mb-4">
            {isPassing ? (
              <div className="w-16 h-16 mx-auto">
                <CorrectIcon />
              </div>
            ) : (
              <div className="w-16 h-16 mx-auto">
                <IncorrectIcon />
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isPassing ? "Congratulations!" : "Try Again"}
          </h2>
          
          <p className="text-gray-600 mb-4">
            {isPassing 
              ? "You've passed the quiz successfully!" 
              : "You didn't pass this time, but don't give up!"}
          </p>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Score:</span>
            <span className="font-semibold">{score.correct} / {score.total} ({score.percentage}%)</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Time spent:</span>
            <span className="font-semibold">{timeSpent}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Status:</span>
            <span className={`font-semibold ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
              {isPassing ? 'Passed' : 'Failed'}
            </span>
          </div>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-custom-primary text-white rounded-md shadow-md hover:bg-primary-dark transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuizFeedbackModal;

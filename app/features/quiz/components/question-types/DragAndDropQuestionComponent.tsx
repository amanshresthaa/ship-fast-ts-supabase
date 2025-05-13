import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { DragAndDropQuestion, DragAndDropOption, DragAndDropTarget } from '../../../../types/quiz';
import { useDragAndDropQuiz } from '../../hooks/useDragAndDropQuiz';
import FeedbackIcon from '../shared/FeedbackIcon';

interface DragAndDropQuestionComponentProps {
  question: DragAndDropQuestion;
  onAnswerChange: (answers: Record<string, string | null>) => void;
  userAnswer?: Record<string, string | null>;
  isSubmitted?: boolean;
  showFeedback?: boolean; // Standardized prop name
  isQuizReviewMode?: boolean;
  validateOnDrop?: boolean;
}

const DragAndDropQuestionComponent: React.FC<DragAndDropQuestionComponentProps> = memo(({
  question,
  onAnswerChange,
  userAnswer,
  isSubmitted = false,
  showFeedback = false, // Standardized prop name, renamed from showFeedbackStyling
  isQuizReviewMode = false,
  validateOnDrop = true,
}) => {
  const {
    placedAnswers,
    availableOptions,
    allTargetsFilled,
    autoValidating,
    handleDragStart,
    handleDrop,
    handleRemoveFromTarget,
    getTargetFeedback,
  } = useDragAndDropQuiz({
    question,
    onAnswerChange,
    userAnswer,
    isSubmitted,
    isQuizReviewMode,
    validateOnDrop,
  });

  // All state management and event handlers (handleDragStart, handleDrop, handleRemoveFromTarget, etc.)
  // are now encapsulated in the useDragAndDropQuiz hook.

  // Helper for drag over styling (can be part of the component or utility if complex)
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isSubmitted && !isQuizReviewMode) {
      e.dataTransfer.dropEffect = 'move';
      e.currentTarget.classList.add('drag-over');
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('drag-over');
  };

  if (!question || !question.targets || !question.options) {
    return <div className="text-red-500">Error: Invalid question data for DragAndDropQuestionComponent.</div>;
  }

  return (
    <div className="p-4 bg-white shadow-lg rounded-lg space-y-6">
      {/* Available Options */}
      <div>
        <p className="font-semibold text-gray-700 mb-3">Available Items to Drag:</p>
        <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-md min-h-[60px]">
          {availableOptions.length > 0 ? (
            availableOptions.map(option => (
              <div // Wrapper div for HTML5 drag and drop
                key={`${option.option_id}-drag-wrapper`}
                draggable={!isSubmitted && !isQuizReviewMode}
                onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, option.option_id)}
                className="cursor-grab" // Apply grab cursor to the draggable wrapper
              >
                <motion.div
                  key={option.option_id} // motion.div can keep its own key if needed for motion
                  // draggable and onDragStart are removed from motion.div
                  className="p-3 bg-blue-100 border-2 border-blue-300 rounded-md shadow-sm hover:shadow-md transition-shadow text-blue-700 font-medium"
                  layoutId={`option-${option.option_id}`}
                >
                  {option.text}
                </motion.div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">All items placed.</p>
          )}
        </div>
      </div>

      {/* Targets */}
      <div>
        <p className="font-semibold text-gray-700 mb-3">Drop Targets:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.targets.map(target => {
            const placedOptionId = placedAnswers[target.target_id];
            const placedOption = placedOptionId ? question.options.find(opt => opt.option_id === placedOptionId) : null;
            const feedback = getTargetFeedback(target.target_id);

            let targetBgColor = 'bg-gray-100';
            let targetBorderColor = 'border-gray-300';
            let textColor = 'text-gray-700';

            if (showFeedback && placedOptionId) {
              if (feedback?.isCorrect) {
                targetBgColor = 'bg-green-50';
                targetBorderColor = 'border-green-500';
                textColor = 'text-green-700';
              } else {
                targetBgColor = 'bg-red-50';
                targetBorderColor = 'border-red-500';
                textColor = 'text-red-700';
              }
            }

            return (
              <div
                key={target.target_id}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, target.target_id)}
                className={`p-4 border-2 border-dashed rounded-lg min-h-[80px] flex flex-col justify-between items-center transition-colors duration-150 ${targetBorderColor} ${targetBgColor}`}
              >
                <p className={`font-medium mb-2 ${textColor}`}>{target.text}</p>
                {placedOption ? (
                  <motion.div
                    className={`p-3 rounded-md shadow-sm w-full text-center font-medium 
                      ${showFeedback && feedback?.isCorrect ? 'bg-green-200 border-green-400 text-green-800' : 
                        showFeedback && !feedback?.isCorrect ? 'bg-red-200 border-red-400 text-red-800' : 
                        'bg-indigo-100 border-indigo-300 text-indigo-700'}
                    `}
                    layoutId={`option-${placedOption.option_id}`}
                  >
                    {placedOption.text}
                    {(!isSubmitted && !isQuizReviewMode) && (
                      <button 
                        onClick={() => handleRemoveFromTarget(target.target_id)} 
                        className="ml-2 text-xs text-red-500 hover:text-red-700 font-bold p-1 bg-red-100 rounded-full"
                        aria-label={`Remove ${placedOption.text}`}
                      >
                        ✕
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Drop item here</span>
                )}
                {showFeedback && feedback && !feedback.isCorrect && placedOptionId && (
                  <p className="text-xs text-red-600 mt-1">Correct: {feedback.correctOptionText}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {autoValidating && allTargetsFilled && !showFeedback && !isSubmitted && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-300 text-blue-700 rounded-md">
          <p className="font-semibold">Checking answer...</p>
        </div>
      )}

      {allTargetsFilled && !autoValidating && !showFeedback && !isSubmitted && !validateOnDrop && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-md">
          <p className="font-semibold">All targets filled. Proceed to next step or submit.</p>
        </div>
      )}
    </div>
  );
});

DragAndDropQuestionComponent.displayName = 'DragAndDropQuestionComponent';
export default DragAndDropQuestionComponent;

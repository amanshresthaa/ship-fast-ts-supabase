'use client';

import React, { useState, useEffect, memo, useMemo } from 'react'; // Added useMemo
import { DragAndDropQuestion, DragAndDropOption, DragAndDropTarget } from '@/app/types/quiz';
import { DragAndDropController } from '../../controllers/DragAndDropController';
import { useAutoValidation } from '../../hooks/useAutoValidation';

interface DragAndDropQuestionComponentProps {
  question: DragAndDropQuestion;
  onAnswerChange: (answers: Record<string, string | null>) => void; // Maps target_id to option_id or null
  userAnswer?: Record<string, string | null>; // Previously selected answers
  isSubmitted?: boolean;
  showFeedbackStyling?: boolean; // Used for styling
  isQuizReviewMode?: boolean; // New prop for review mode
  validateOnDrop?: boolean; // Auto-validate when all targets are filledx
}

/**
 * DragAndDropQuestionComponent handles drag and drop interactions for matching questions
 * Uses the DragAndDropController for business logic and validation
 */
const DragAndDropQuestionComponent: React.FC<DragAndDropQuestionComponentProps> = ({ 
  question, 
  onAnswerChange, 
  userAnswer, 
  isSubmitted = false,
  showFeedbackStyling = false,
  isQuizReviewMode = false,
  validateOnDrop = true
}) => {
  // Create controller instance, memoized to prevent re-creation
  const controller = useMemo(() => new DragAndDropController(question), [question]);
  
  // Track the current dragged option ID for browsers that don't support dataTransfer properly
  const [currentDraggedOptionId, setCurrentDraggedOptionId] = useState<string | null>(null);
  
  // State to track available (unplaced) options
  const [availableOptions, setAvailableOptions] = useState<DragAndDropOption[]>(
    controller.getOptions()
  );

  // Initialize with controller's initial answers, memoized
  const initialAnswers = useMemo(() => controller.createInitialAnswers(), [controller]);
  
  // Use auto-validation hook
  const [placedAnswers, setPlacedAnswers, autoValidating, allTargetsFilled] = useAutoValidation<
    DragAndDropQuestion,
    Record<string, string | null>
  >(
    controller,
    userAnswer || initialAnswers,
    onAnswerChange,
    validateOnDrop
  );

  // Effect to update available options whenever placedAnswers changes
  useEffect(() => {
    if (isQuizReviewMode) {
      // Use controller to prepare review mode state
      const correctReviewAnswers = controller.createInitialAnswers();
      question.correctPairs.forEach(pair => {
        correctReviewAnswers[pair.target_id] = pair.option_id;
      });
      setPlacedAnswers(correctReviewAnswers);
      
      // Update available options using controller method
      const usedOptionIdsInReview = Object.values(correctReviewAnswers).filter(Boolean) as string[];
      setAvailableOptions(
        controller.getOptions().filter(opt => !usedOptionIdsInReview.includes(opt.option_id))
      );
    } else {
      // Use controller to get available options
      setAvailableOptions(controller.getAvailableOptions(placedAnswers));
    }
  }, [controller, placedAnswers, isQuizReviewMode, question.correctPairs, setPlacedAnswers]);

  /**
   * Handles drag start event for an option
   */
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, optionId: string) => {
    // Store the current dragged option ID in state (fallback for browsers with dataTransfer issues)
    setCurrentDraggedOptionId(optionId);
    
    try {
      // Set data in dataTransfer object
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', optionId);
    } catch (err) {
      console.warn('Could not set dataTransfer data:', err);
      // We'll rely on the state variable in this case
    }
  };

  /**
   * Updates placement of an option to a target
   */
  const updatePlacement = (optionId: string, targetId: string) => {
    if (isSubmitted || isQuizReviewMode) return;
    
    // Create new copy of placed answers
    const newAnswers: Record<string, string | null> = { ...placedAnswers };
    
    // Clear the option from any other target it might have been in
    for (const tId in newAnswers) {
      if (newAnswers[tId] === optionId && tId !== targetId) {
        newAnswers[tId] = null;
      }
    }
    
    // Place the option in the target
    newAnswers[targetId] = optionId;
    
    // Update state with new answers (this will trigger useAutoValidation)
    setPlacedAnswers(newAnswers);
  };

  /**
   * Handles drop event on a target
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    if (isSubmitted || isQuizReviewMode) return;

    // Get the option ID from dataTransfer or state
    let optionId = e.dataTransfer.getData('text/plain');
    if (!optionId && currentDraggedOptionId) {
      optionId = currentDraggedOptionId;
    }

    if (!optionId) return;

    // Validate option exists
    const optionBeingMoved = controller.getOptions().find(opt => opt.option_id === optionId);
    if (!optionBeingMoved) return;
    
    updatePlacement(optionId, targetId);
    setCurrentDraggedOptionId(null);
  };

  /**
   * Drag event handlers
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  /**
   * Removes an option from a target
   */
  const handleRemoveFromTarget = (targetId: string) => {
    if (isSubmitted || isQuizReviewMode) return;
    
    const optionId = placedAnswers[targetId];
    if (!optionId) return;
    
    // Update answers through controller logic
    const newAnswers: Record<string, string | null> = { ...placedAnswers, [targetId]: null };
    setPlacedAnswers(newAnswers);
  };

  /**
   * Renders a draggable option item
   */
  const renderOption = (option: DragAndDropOption) => {
    return (
      <div
        key={option.option_id}
        draggable={!isSubmitted && !isQuizReviewMode}
        onDragStart={(e) => handleDragStart(e, option.option_id)}
        className="p-2 bg-blue-100 border border-blue-300 rounded cursor-grab transition-all duration-200 hover:scale-105"
      >
        {option.text}
      </div>
    );
  };

  /**
   * Determines if we should show feedback for answers
   */
  const shouldShowFeedback = (): boolean => {
    // Only show when explicitly enabled and either in review mode or all targets filled
    return showFeedbackStyling && (isQuizReviewMode || allTargetsFilled);
  };

  /**
   * Gets border color for a target based on correctness
   */
  const getTargetBorderColor = (targetId: string, placedOptionId: string | null): string => {
    // Default style when not showing feedback
    if (!shouldShowFeedback()) {
      return 'border-gray-300';
    }
    
    // When showing feedback, check if placement is correct
    const isCorrect = controller.isPlacementCorrect(targetId, placedOptionId);
    return isCorrect ? 'border-green-500' : 'border-red-500';
  };
  
  /**
   * Gets hint text for incorrect answers when showing feedback
   */
  const getTargetHintText = (targetId: string, placedOptionId: string | null): string | null => {
    // Only show hints when feedback is enabled and placement is incorrect
    if (!shouldShowFeedback()) {
      return null;
    }
    
    // Don't show hint if placement is correct
    if (controller.isPlacementCorrect(targetId, placedOptionId)) {
      return null;
    }
    
    // Get the correct option for this target
    const correctOptionId = controller.getCorrectOptionForTarget(targetId);
    if (!correctOptionId) {
      return null;
    }
    
    // Find option details
    const correctOption = controller.getOptions().find(
      opt => opt.option_id === correctOptionId
    );
    
    return correctOption ? `(Correct: ${correctOption.text})` : null;
  };
  
  /**
   * Renders a target with appropriate styling based on state
   */
  const renderTarget = (target: DragAndDropTarget) => {
    const placedOptionId = placedAnswers[target.target_id];
    const placedOption = placedOptionId ? 
      controller.getOptions().find(opt => opt.option_id === placedOptionId) : 
      null;
      
    const borderColor = getTargetBorderColor(target.target_id, placedOptionId);
    const hintText = getTargetHintText(target.target_id, placedOptionId);

    return (
      <div
        key={target.target_id}
        onDrop={(e) => handleDrop(e, target.target_id)}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`p-4 border-2 ${borderColor} rounded min-h-[80px] bg-gray-50 flex flex-col justify-between transition-all duration-200`}
      >
        <p className="font-semibold">{target.text}</p>
        {placedOption && (
          <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded flex justify-between items-center">
            <span>{placedOption.text}</span>
            {!isSubmitted && !isQuizReviewMode && (
              <button
                onClick={() => handleRemoveFromTarget(target.target_id)}
                className="ml-2 text-red-500 hover:text-red-700"
                title="Remove item"
                aria-label="Remove item"
              >
                &times;
              </button>
            )}
          </div>
        )}
        {hintText && <p className="text-xs mt-1 text-gray-600">{hintText}</p>}
      </div>
    );
  };

  // Dev info banner component
  const DevInfoBanner = memo(() => (
    <div className="mt-4 p-2 border rounded bg-gray-50 text-xs">
      <p>Dev Info: {allTargetsFilled ? 'All targets filled' : 'Not all targets filled'}</p>
    </div>
  ));

  // Auto-validating feedback banner
  const AutoValidatingBanner = memo(() => (
    <div className="mt-4 p-2 bg-yellow-100 border border-yellow-300 rounded">
      <p className="text-sm text-yellow-700">All targets filled. Your answer will be submitted.</p>
    </div>
  ));

  // Ready to submit banner
  const ReadyBanner = memo(() => (
    <div className="mt-4 p-2 bg-green-100 border border-green-300 rounded">
      <p className="text-sm text-green-700">All targets filled. Ready to submit.</p>
    </div>
  ));
  
  /**
   * Determines which feedback banner to show
   */
  const getFeedbackBanner = () => {
    // Show development info in development mode
    if (process.env.NODE_ENV === 'development') {
      return <DevInfoBanner />;
    }
    
    // Only show banners when not already submitted and not showing feedback
    if (isSubmitted || showFeedbackStyling) {
      return null;
    }
    
    // Auto-validating state
    if (autoValidating && allTargetsFilled) {
      return <AutoValidatingBanner />;
    }
    
    // Ready to submit state
    if (allTargetsFilled && !autoValidating) {
      return <ReadyBanner />;
    }
    
    return null;
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      {/* Available Options */}
      <div className="mb-4">
        <p className="font-medium">Available Items:</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {availableOptions.map(renderOption)}
        </div>
      </div>

      {/* Targets */}
      <div>
        <p className="font-medium">Match items to the correct targets:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {controller.getTargets().map(renderTarget)}
        </div>
      </div>

      {getFeedbackBanner()}
    </div>
  );
};

export default DragAndDropQuestionComponent;

import React, { useState, useEffect } from 'react';
import { DragAndDropQuestion, DragAndDropOption, DragAndDropTarget } from '@/app/types/quiz';

interface DragAndDropQuestionComponentProps {
  question: DragAndDropQuestion;
  onAnswerChange: (answers: Record<string, string | null>) => void; // Maps target_id to option_id or null
  userAnswer?: Record<string, string | null>; // Previously selected answers
  isSubmitted?: boolean;
  showFeedbackStyling?: boolean; // Renamed from showCorrectAnswer, used for styling
  isQuizReviewMode?: boolean; // New prop for review mode
  validateOnDrop?: boolean; // Auto-validate when all targets are filled
}

const DragAndDropQuestionComponent: React.FC<DragAndDropQuestionComponentProps> = ({ 
  question, 
  onAnswerChange, 
  userAnswer, 
  isSubmitted = false,
  showFeedbackStyling = false, // Updated prop
  isQuizReviewMode = false, // New prop
  validateOnDrop = true // Default to true for auto-validation
}) => {
  // State to track which option is placed in which target
  // Format: { target_id: option_id | null }
  const [placedAnswers, setPlacedAnswers] = useState<Record<string, string | null>>({});
  // State to track available (unplaced) options
  const [availableOptions, setAvailableOptions] = useState<DragAndDropOption[]>(question.options);
  // State to track if all targets are filled
  const [allTargetsFilled, setAllTargetsFilled] = useState<boolean>(false);
  // State to track if answers are being validated 
  const [autoValidating, setAutoValidating] = useState<boolean>(false);
  // Track the current dragged option ID for browsers that don't support dataTransfer properly
  const [currentDraggedOptionId, setCurrentDraggedOptionId] = useState<string | null>(null);

  // Helper function to check if all targets are filled
  const checkAllTargetsFilled = (answers: Record<string, string | null>): boolean => {
    // If no answers object or it's empty, targets can't be filled
    if (!answers || Object.keys(answers).length === 0) return false;
    
    // No targets means nothing to fill
    if (question.targets.length === 0) return false;
    
    // Check that every target has a valid non-null option assigned
    const allFilled = question.targets.every(target => {
      const targetId = target.target_id;
      // Make sure the target exists in answers and has a non-null value
      return targetId in answers && answers[targetId] !== null && answers[targetId] !== undefined;
    });
    
    return allFilled;
  };

  // Helper function to validate answers against correct pairs
  const validateAnswers = (answers: Record<string, string | null>): Record<string, boolean> => {
    const validationResults: Record<string, boolean> = {};
    
    question.targets.forEach(target => {
      const targetId = target.target_id;
      const placedOptionId = answers[targetId];
      
      if (placedOptionId) {
        const correctPair = question.correctPairs.find(p => p.target_id === targetId);
        validationResults[targetId] = correctPair ? correctPair.option_id === placedOptionId : false;
      } else {
        validationResults[targetId] = false; // Empty targets are incorrect
      }
    });
    
    return validationResults;
  };

  useEffect(() => {
    const initialAnswers: Record<string, string | null> = {};
    question.targets.forEach(target => {
      initialAnswers[target.target_id] = null;
    });

    let newPlacedAnswers = { ...initialAnswers };
    let newAvailableOptions = [...question.options];

    if (isQuizReviewMode) {
      const correctReviewAnswers: Record<string, string | null> = { ...initialAnswers };
      question.correctPairs.forEach(pair => {
        correctReviewAnswers[pair.target_id] = pair.option_id;
      });
      newPlacedAnswers = correctReviewAnswers;
      const usedOptionIdsInReview = Object.values(correctReviewAnswers).filter(id => id !== null) as string[];
      newAvailableOptions = question.options.filter(opt => !usedOptionIdsInReview.includes(opt.option_id));
    } else if (userAnswer && Object.keys(userAnswer).length > 0) {
      newPlacedAnswers = { ...initialAnswers, ...userAnswer };
      const usedOptionIdsUser = Object.values(newPlacedAnswers).filter(id => id !== null) as string[];
      newAvailableOptions = question.options.filter(opt => !usedOptionIdsUser.includes(opt.option_id));
    }
    
    setPlacedAnswers(newPlacedAnswers);
    setAvailableOptions(newAvailableOptions);

    const allFilledCurrent = checkAllTargetsFilled(newPlacedAnswers);
    setAllTargetsFilled(allFilledCurrent);
    
    if (validateOnDrop && allFilledCurrent && !isSubmitted && !isQuizReviewMode) {
      setAutoValidating(true);
      // Do NOT call onAnswerChange here in useEffect for initial load based on userAnswer.
      // Submission should only happen on explicit user action (drop) that completes all targets.
    } else {
      setAutoValidating(false);
    }
  }, [question, userAnswer, isQuizReviewMode, isSubmitted, validateOnDrop]); // Removed onAnswerChange from here

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    if (isSubmitted || isQuizReviewMode) return;

    let optionId = e.dataTransfer.getData('text/plain');
    if (!optionId && currentDraggedOptionId) {
      optionId = currentDraggedOptionId;
    }

    if (!optionId) return;

    const optionBeingMoved = question.options.find(opt => opt.option_id === optionId);
    if (!optionBeingMoved) return;

    setPlacedAnswers(prevPlacedAnswers => {
      let intermediateAnswers: Record<string, string | null> = { ...prevPlacedAnswers };
      const oldOptionIdInTarget = prevPlacedAnswers[targetId];

      // Clear the option from any other target it might have been in
      for (const tId in intermediateAnswers) {
        if (intermediateAnswers[tId] === optionId && tId !== targetId) {
          intermediateAnswers[tId] = null;
        }
      }
      
      intermediateAnswers[targetId] = optionId;
      const newAnswers = { ...intermediateAnswers };

      const currentlyAllFilled = checkAllTargetsFilled(newAnswers);
      setAllTargetsFilled(currentlyAllFilled); 

      // Update available options
      setAvailableOptions(prevOptions => {
        // Remove the dropped option
        let updatedOptions = prevOptions.filter(opt => opt.option_id !== optionId);
        // Add back the option that was previously in the target, if any, and it's not the one just dropped
        if (oldOptionIdInTarget && oldOptionIdInTarget !== optionId) {
          const oldOptionDetails = question.options.find(opt => opt.option_id === oldOptionIdInTarget);
          if (oldOptionDetails && !updatedOptions.some(opt => opt.option_id === oldOptionDetails.option_id)) {
            updatedOptions.push(oldOptionDetails);
          }
        }
        return updatedOptions;
      });
      
      if (validateOnDrop && currentlyAllFilled && !isSubmitted && !isQuizReviewMode) {
        setAutoValidating(true);
        onAnswerChange(newAnswers); // This will trigger submission in QuestionCard
      } else {
        setAutoValidating(false);
        // If you need to inform parent about intermediate changes without submitting:
        // onAnswerChange(newAnswers); // But be careful, as this is tied to submission logic in QuestionCard
      }
      return newAnswers;
    });
    setCurrentDraggedOptionId(null);
  };

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

  const handleRemoveFromTarget = (targetId: string) => {
    if (isSubmitted || isQuizReviewMode) return;
    
    const optionId = placedAnswers[targetId];
    if (!optionId) return;
    
    setPlacedAnswers(prevPlacedAnswers => {
      const newAnswers: Record<string, string | null> = { ...prevPlacedAnswers, [targetId]: null };
      const currentlyAllFilled = checkAllTargetsFilled(newAnswers);
      setAllTargetsFilled(currentlyAllFilled);

      const removedOptionDetails = question.options.find(opt => opt.option_id === optionId);
      if (removedOptionDetails) {
        setAvailableOptions(prevOptions => {
          if (!prevOptions.some(opt => opt.option_id === removedOptionDetails.option_id)) {
            return [...prevOptions, removedOptionDetails];
          }
          return prevOptions;
        });
      }

      if (autoValidating && !currentlyAllFilled) {
          setAutoValidating(false);
      }
      // Do not call onAnswerChange here, as removing an item makes the answer incomplete.
      return newAnswers;
    });
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h3 className="text-lg font-semibold mb-2">{question.question}</h3>
      
      {/* Available Options */}
      <div className="mb-4">
        <p className="font-medium">Available Items:</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {availableOptions.map(option => (
            <div
              key={option.option_id}
              draggable={!isSubmitted && !isQuizReviewMode}
              onDragStart={(e) => handleDragStart(e, option.option_id)}
              className="p-2 bg-blue-100 border border-blue-300 rounded cursor-grab"
            >
              {option.text}
            </div>
          ))}
        </div>
      </div>

      {/* Targets */}
      <div>
        <p className="font-medium">Match items to the correct targets:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {question.targets.map(target => {
            const placedOptionId = placedAnswers[target.target_id];
            const placedOption = placedOptionId ? question.options.find(opt => opt.option_id === placedOptionId) : null;

            let borderColor = 'border-gray-300'; // Default border
            let hintText: string | null = null;

            // Determine if detailed feedback (styling, hints) should be applied to this target.
            // This is true if global feedback styling is on, AND (it's review mode OR the user filled all targets for their attempt).
            const applyDetailedTargetFeedback = showFeedbackStyling && (isQuizReviewMode || allTargetsFilled);

            if (applyDetailedTargetFeedback) {
              const correctPairForTarget = question.correctPairs.find(p => p.target_id === target.target_id);

              if (placedOptionId) { // An option is placed in this target
                if (correctPairForTarget && correctPairForTarget.option_id === placedOptionId) {
                  borderColor = 'border-green-500'; // User's placement is correct
                } else {
                  borderColor = 'border-red-500'; // User's placement is incorrect
                  if (correctPairForTarget) {
                    const correctOptionDetails = question.options.find(opt => opt.option_id === correctPairForTarget.option_id);
                    hintText = correctOptionDetails ? `(Correct: ${correctOptionDetails.text})` : '(Correct answer details not found)';
                  } else { // Placed an option where target should be empty (no correct pair defined)
                    hintText = '(This target should be empty)';
                  }
                }
              } else { // This target is empty in placedAnswers
                if (correctPairForTarget) { // Target should have been filled
                  borderColor = 'border-red-500'; // Incorrectly empty
                  const correctOptionDetails = question.options.find(opt => opt.option_id === correctPairForTarget.option_id);
                  hintText = correctOptionDetails ? `(Correct: ${correctOptionDetails.text})` : '(Correct answer details not found)';
                } else {
                  // Target is correctly empty (no correctPair for it)
                  borderColor = 'border-green-500'; // Style as correct (or neutral if preferred)
                }
              }
            }

            return (
              <div
                key={target.target_id}
                onDrop={(e) => handleDrop(e, target.target_id)}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                className={`p-4 border-2 ${borderColor} rounded min-h-[80px] bg-gray-50 flex flex-col justify-between`}
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
                      >
                        &times;
                      </button>
                    )}
                  </div>
                )}
                {hintText && <p className="text-xs mt-1">{hintText}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 border rounded bg-gray-50 text-xs">
          {/* ... existing dev info ... */}
        </div>
      )}
      
      {autoValidating && allTargetsFilled && !showFeedbackStyling && !isSubmitted && (
        <div className="mt-4 p-2 bg-yellow-100 border border-yellow-300 rounded">
          <p className="text-sm text-yellow-700">All targets filled. Your answer will be submitted.</p>
        </div>
      )}
      
      {allTargetsFilled && !autoValidating && !showFeedbackStyling && !isSubmitted && (
         <div className="mt-4 p-2 bg-green-100 border border-green-300 rounded">
           <p className="text-sm text-green-700">All targets filled. Ready to submit.</p>
         </div>
      )}
    </div>
  );
};

export default DragAndDropQuestionComponent;

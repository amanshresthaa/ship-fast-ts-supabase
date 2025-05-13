import { useState, useEffect, useCallback } from 'react';
import { DragAndDropQuestion, DragAndDropOption, DragAndDropTarget } from '../../../../types/quiz'; // Adjust path as needed

interface UseDragAndDropQuizArgs {
  question: DragAndDropQuestion;
  onAnswerChange: (answers: Record<string, string | null>) => void;
  userAnswer?: Record<string, string | null>;
  isSubmitted?: boolean;
  isQuizReviewMode?: boolean;
  validateOnDrop?: boolean;
}

export const useDragAndDropQuiz = ({
  question,
  onAnswerChange,
  userAnswer,
  isSubmitted = false,
  isQuizReviewMode = false,
  validateOnDrop = true,
}: UseDragAndDropQuizArgs) => {
  const [placedAnswers, setPlacedAnswers] = useState<Record<string, string | null>>({});
  const [availableOptions, setAvailableOptions] = useState<DragAndDropOption[]>(question.options);
  const [allTargetsFilled, setAllTargetsFilled] = useState<boolean>(false);
  const [autoValidating, setAutoValidating] = useState<boolean>(false);
  const [currentDraggedOptionId, setCurrentDraggedOptionId] = useState<string | null>(null);

  const checkAllTargetsFilled = useCallback((answers: Record<string, string | null>): boolean => {
    if (!answers || Object.keys(answers).length === 0) return false;
    if (question.targets.length === 0) return true; // No targets means all (zero) targets are filled
    return question.targets.every(target => 
      answers[target.target_id] !== null && answers[target.target_id] !== undefined
    );
  }, [question.targets]);

  useEffect(() => {
    const initialAnswers: Record<string, string | null> = {};
    question.targets.forEach(target => {
      initialAnswers[target.target_id] = null;
    });

    let newPlacedAnswers = { ...initialAnswers };
    let newAvailableOptions = [...question.options];

    const sourceAnswers = isQuizReviewMode && userAnswer ? userAnswer : userAnswer;

    if (sourceAnswers && Object.keys(sourceAnswers).length > 0) {
      newPlacedAnswers = { ...initialAnswers }; // Start fresh for placed answers
      const usedOptionIds = new Set<string>();

      Object.entries(sourceAnswers).forEach(([targetId, optionId]) => {
        if (optionId && question.targets.find(t => t.target_id === targetId) && question.options.find(o => o.option_id === optionId)) {
          newPlacedAnswers[targetId] = optionId;
          usedOptionIds.add(optionId);
        }
      });
      newAvailableOptions = question.options.filter(opt => !usedOptionIds.has(opt.option_id));
    }
    
    setPlacedAnswers(newPlacedAnswers);
    setAvailableOptions(newAvailableOptions);

    const allFilledCurrent = checkAllTargetsFilled(newPlacedAnswers);
    setAllTargetsFilled(allFilledCurrent);

    if (validateOnDrop && allFilledCurrent && !isSubmitted && !isQuizReviewMode) {
      setAutoValidating(true);
      onAnswerChange(newPlacedAnswers);
    } else {
      setAutoValidating(false);
    }
  }, [question, userAnswer, isQuizReviewMode, isSubmitted, validateOnDrop, checkAllTargetsFilled, onAnswerChange]);

  const handleDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, optionId: string) => {
    if (isSubmitted || isQuizReviewMode) return;
    setCurrentDraggedOptionId(optionId);
    try {
      event.dataTransfer.setData('text/plain', optionId);
      event.dataTransfer.effectAllowed = 'move';
    } catch (err) {
      // Fallback for browsers with issues (e.g., older Safari on mobile)
      console.warn("DataTransfer API not fully supported, relying on state for dragged item.", err);
    }
  }, [isSubmitted, isQuizReviewMode]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    if (isSubmitted || isQuizReviewMode) return;

    let optionId = event.dataTransfer.getData('text/plain');
    if (!optionId && currentDraggedOptionId) {
      optionId = currentDraggedOptionId;
    }

    if (!optionId) return;

    const optionBeingMoved = question.options.find(opt => opt.option_id === optionId);
    if (!optionBeingMoved) return;

    setPlacedAnswers(prevPlacedAnswers => {
      const newAnswers = { ...prevPlacedAnswers };
      const previousOptionInTarget = newAnswers[targetId];

      // Place the new option
      newAnswers[targetId] = optionId;

      setAvailableOptions(prevOptions => {
        let updatedOptions = prevOptions.filter(opt => opt.option_id !== optionId);
        if (previousOptionInTarget) {
          const previousOptionDetails = question.options.find(opt => opt.option_id === previousOptionInTarget);
          if (previousOptionDetails && !updatedOptions.some(opt => opt.option_id === previousOptionDetails.option_id)) {
            updatedOptions = [...updatedOptions, previousOptionDetails];
          }
        }
        return updatedOptions.sort((a, b) => question.options.indexOf(a) - question.options.indexOf(b)); // Maintain original sort order
      });

      const allFilled = checkAllTargetsFilled(newAnswers);
      setAllTargetsFilled(allFilled);

      if (validateOnDrop && allFilled && !isSubmitted) {
        setAutoValidating(true);
        onAnswerChange(newAnswers);
      } else {
        setAutoValidating(false);
        if (!validateOnDrop || !allFilled) { // Report partial answers if not auto-validating on complete
            onAnswerChange(newAnswers);
        }
      }
      return newAnswers;
    });
    setCurrentDraggedOptionId(null);
  }, [isSubmitted, isQuizReviewMode, currentDraggedOptionId, question.options, checkAllTargetsFilled, validateOnDrop, onAnswerChange]);

  const handleRemoveFromTarget = useCallback((targetId: string) => {
    if (isSubmitted || isQuizReviewMode) return;

    const optionId = placedAnswers[targetId];
    if (!optionId) return;

    setPlacedAnswers(prevPlacedAnswers => {
      const newAnswers = { ...prevPlacedAnswers, [targetId]: null };
      const currentlyAllFilled = checkAllTargetsFilled(newAnswers);
      setAllTargetsFilled(currentlyAllFilled);

      const removedOptionDetails = question.options.find(opt => opt.option_id === optionId);
      if (removedOptionDetails) {
        setAvailableOptions(prevOptions => {
          if (!prevOptions.some(opt => opt.option_id === removedOptionDetails.option_id)) {
            const updatedOptions = [...prevOptions, removedOptionDetails];
            return updatedOptions.sort((a, b) => question.options.indexOf(a) - question.options.indexOf(b)); // Maintain original sort order
          }
          return prevOptions;
        });
      }

      if (autoValidating && !currentlyAllFilled) {
        setAutoValidating(false);
      }
      onAnswerChange(newAnswers); // Report change when an item is removed
      return newAnswers;
    });
  }, [isSubmitted, isQuizReviewMode, placedAnswers, checkAllTargetsFilled, question.options, autoValidating, onAnswerChange]);
  
  const getTargetFeedback = useCallback((targetId: string): { isCorrect: boolean; correctOptionText?: string } | null => {
    if (!isSubmitted && !showFeedbackStyling) return null;

    const placedOptionId = placedAnswers[targetId];
    if (!placedOptionId) return null; // No answer placed

    const correctPair = question.correctPairs.find(pair => pair.target_id === targetId);
    if (!correctPair) return null; // Should not happen if data is consistent

    const isCorrect = placedOptionId === correctPair.option_id;
    const correctOptionDetails = question.options.find(opt => opt.option_id === correctPair.option_id);

    return {
      isCorrect,
      correctOptionText: correctOptionDetails?.text
    };
  }, [placedAnswers, question.correctPairs, question.options, isSubmitted, showFeedbackStyling]);


  return {
    placedAnswers,
    availableOptions,
    allTargetsFilled,
    autoValidating,
    currentDraggedOptionId, // Though primarily internal, exposing if needed for specific UI effects
    handleDragStart,
    handleDrop,
    handleRemoveFromTarget,
    checkAllTargetsFilled, // Exposing if parent component needs to react to this
    getTargetFeedback, // For displaying feedback per target
  };
};

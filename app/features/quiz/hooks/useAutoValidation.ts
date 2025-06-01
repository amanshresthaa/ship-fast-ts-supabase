import { useState, useEffect, useRef } from 'react';
import { QuestionController } from '../controllers/QuestionController';
import { AnyQuestion } from '@/app/types/quiz';

/**
 * React hook that manages automatic validation logic for question components.
 *
 * Tracks the current answer state, determines if the answer is complete, and triggers validation when appropriate. Automatically calls the provided callback when a complete answer is detected and validation is enabled. Prevents duplicate submissions and skips validation on initial render.
 *
 * @param controller - Controller used to determine answer completeness.
 * @param initialAnswer - The initial answer value.
 * @param onAnswerChange - Callback invoked when a complete answer is detected and validation is triggered.
 * @param validateOnComplete - If true, triggers validation automatically when the answer becomes complete. Defaults to true.
 * @returns A tuple containing the current answer, a setter function for the answer, a boolean indicating if validation is in progress, and a boolean indicating if the answer is complete.
 */
export function useAutoValidation<Q extends AnyQuestion, A>(
  controller: QuestionController<Q, A>,
  initialAnswer: A,
  onAnswerChange: (answer: A) => void,
  validateOnComplete: boolean = true
): [A, (answer: A) => void, boolean, boolean] {
  const [answer, setAnswer] = useState<A>(initialAnswer);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [allComplete, setAllComplete] = useState<boolean>(false);

  // Use a ref to track if we've submitted this answer already
  // to avoid duplicate submissions
  const hasSubmittedRef = useRef<boolean>(false);
  
  // To distinguish between initial render and user interactions
  const isInitialRender = useRef<boolean>(true);
  
  // If initialAnswer changes (new question), reset submission status
  useEffect(() => {
    hasSubmittedRef.current = false;
    isInitialRender.current = true;
  }, [controller]);
  
  // Check completeness whenever answer changes
  useEffect(() => {
    const isComplete = controller.isAnswerComplete(answer);
    setAllComplete(isComplete);
    
    // Skip auto-validation on initial render (when loading previous answers)
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    // If answer is complete, not already submitted, and validateOnComplete is true
    // trigger validation and submission
    if (isComplete && validateOnComplete && !hasSubmittedRef.current) {
      setIsValidating(true);
      hasSubmittedRef.current = true;
      onAnswerChange(answer);
    } else if (!isComplete) {
      // Reset submission flag and validation state when answer becomes incomplete
      hasSubmittedRef.current = false;
      setIsValidating(false);
    }
  }, [answer, controller, onAnswerChange, validateOnComplete]);
  
  // Wrapper for setAnswer that also updates external state
  const updateAnswer = (newAnswer: A) => {
    setAnswer(newAnswer);
  };
  
  return [answer, updateAnswer, isValidating, allComplete];
}

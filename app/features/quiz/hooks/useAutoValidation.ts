import { useState, useEffect, useRef } from 'react';
import { QuestionController } from '../controllers/QuestionController';
import { AnyQuestion } from '@/app/types/quiz';

/**
 * Hook that manages auto-validation for question components
 * 
 * @param controller The question controller
 * @param initialAnswer Initial answer state
 * @param onAnswerChange Callback when answer changes
 * @param validateOnComplete Whether to auto-validate when answer is complete
 * @returns [answer, setAnswer, isValidating, allComplete]
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

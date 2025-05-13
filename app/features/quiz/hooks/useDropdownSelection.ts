import { useState, useEffect, useMemo, useCallback } from 'react';
import { DropdownSelectionQuestion } from '../../../../types/quiz'; // ust path as needed
import { parseDropdownQuestion } from '../utils/questionParser'; // ath as needed

interface UseDropdownSelectionArgs {
  question: DropdownSelectionQuestion;
  onAnswerSelect: (answer: Record<string, string | null>) => void;
  selectedAnswer?: Record<string, string | null> | null;
  isSubmitted?: boolean;
  validateOnComplete?: boolean;
}

export const useDropdownSelection = ({
  question,
  onAnswerSelect,
  selectedAnswer,
  isSubmitted = false,
  validateOnComplete = true,
}: UseDropdownSelectionArgs) => {
  const [currentSelections, setCurrentSelections] = useState<Record<string, string | null>>({});
  const [allDropdownsFilled, setAllDropdownsFilled] = useState<boolean>(false);
  const [autoValidating, setAutoValidating] = useState<boolean>(false);

  const checkAllDropdownsFilled = useCallback((selections: Record<string, string | null>): boolean => {
    if (!selections || !question.placeholderTargets || Object.keys(question.placeholderTargets).length === 0) {
      return false;
    }
    return Object.keys(question.placeholderTargets).every(
      (key) => selections[key] !== null && selections[key] !== undefined && selections[key] !== ''
    );
  }, [question.placeholderTargets]);

  useEffect(() => {
    const initialSelections: Record<string, string | null> = {};
    if (question.placeholderTargets) {
      Object.keys(question.placeholderTargets).forEach((key) => {
        initialSelections[key] = selectedAnswer?.[key] || null;
      });
    }
    setCurrentSelections(initialSelections);

    const allFilled = checkAllDropdownsFilled(initialSelections);
    setAllDropdownsFilled(allFilled);
    setAutoValidating(false);
  }, [question.placeholderTargets, selectedAnswer, checkAllDropdownsFilled]);

  const handleSelectChange = useCallback((placeholderKey: string, selectedOptionText: string | null) => {
    if (isSubmitted) return;

    setCurrentSelections((prevSelections) => {
      const newSelections = {
        ...prevSelections,
        [placeholderKey]: selectedOptionText,
      };

      const allFilled = checkAllDropdownsFilled(newSelections);
      setAllDropdownsFilled(allFilled);

      if (validateOnComplete && allFilled && !isSubmitted) {
        setAutoValidating(true);
        onAnswerSelect(newSelections);
      } else {
        setAutoValidating(false);
        // Optionally, you might want to call onAnswerSelect here if partial answers should be reported
        // onAnswerSelect(newSelections); 
      }
      return newSelections;
    });
  }, [isSubmitted, checkAllDropdownsFilled, validateOnComplete, onAnswerSelect]);

  const parsedQuestionParts = useMemo(() => {
    return parseDropdownQuestion(question.question);
  }, [question.question]);

  return {
    currentSelections,
    allDropdownsFilled,
    autoValidating,
    handleSelectChange,
    parsedQuestionParts,
    allDropdownOptions: question.options || [],
  };
};

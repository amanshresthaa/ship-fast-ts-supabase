import React, { useState, useEffect, useMemo, memo } from 'react';
import { DropdownSelectionQuestion, DropdownOption } from '../../../../types/quiz';

interface DropdownSelectionComponentProps {
  question: DropdownSelectionQuestion;
  onAnswerSelect: (answer: Record<string, string | null>) => void;
  selectedAnswer?: Record<string, string | null> | null;
  isSubmitted?: boolean;
  showCorrectAnswer?: boolean;
  validateOnComplete?: boolean; // New prop similar to validateOnDrop in DragAndDrop
}

const DropdownSelectionComponent: React.FC<DropdownSelectionComponentProps> = ({
  question,
  onAnswerSelect,
  selectedAnswer,
  isSubmitted = false,
  showCorrectAnswer = false,
  validateOnComplete = true, // Default to true for auto-validation
}) => {
  const [currentSelections, setCurrentSelections] = useState<Record<string, string | null>>({});
  // State to track if all dropdowns are filled
  const [allDropdownsFilled, setAllDropdownsFilled] = useState<boolean>(false);
  // State to track if we're in the auto-validation mode
  const [autoValidating, setAutoValidating] = useState<boolean>(false);

  // Helper function to check if all dropdowns are filled
  const checkAllDropdownsFilled = (selections: Record<string, string | null>): boolean => {
    // If no selections object or no placeholder targets, nothing to fill
    if (!selections || !question.placeholderTargets || Object.keys(question.placeholderTargets).length === 0) {
      return false;
    }
    
    // Check that every placeholder target has a non-null value selected
    return Object.keys(question.placeholderTargets).every(key => 
      selections[key] !== null && selections[key] !== undefined && selections[key] !== ""
    );
  };

  // Initialize selections from selectedAnswer prop or defaults
  useEffect(() => {
    const initialSelections: Record<string, string | null> = {};
    if (question.placeholderTargets) {
      Object.keys(question.placeholderTargets).forEach(placeholderKey => {
        initialSelections[placeholderKey] = selectedAnswer?.[placeholderKey] || null;
      });
    }
    setCurrentSelections(initialSelections);
    
    // Check if all dropdowns are already filled
    const allFilled = checkAllDropdownsFilled(initialSelections);
    setAllDropdownsFilled(allFilled);
    
    // Reset auto-validating state when question or answer changes
    setAutoValidating(false);
  }, [question.placeholderTargets, selectedAnswer]);

  const handleSelectChange = (placeholderKey: string, selectedOptionText: string | null) => {
    if (isSubmitted) return; // Don't allow changes after submission shown

    const newSelections = {
      ...currentSelections,
      [placeholderKey]: selectedOptionText,
    };
    setCurrentSelections(newSelections);
    
    // Check if all dropdowns are now filled
    const allFilled = checkAllDropdownsFilled(newSelections);
    setAllDropdownsFilled(allFilled);
    
    // If all dropdowns are filled and we're set to validate on complete,
    // trigger the submission
    if (validateOnComplete && allFilled && !isSubmitted) {
      setAutoValidating(true);
      onAnswerSelect(newSelections);
    } else {
      // If not all dropdowns are filled or we don't auto-validate,
      // just update the state without triggering submission
      setAutoValidating(false);
    }
  };

  // Memoize parsed parts to avoid re-computation on every render unless question.question changes
  const parsedQuestionParts = useMemo(() => {
    const parts: (string | { placeholder: string })[] = [];
    if (!question.question) return parts;

    // Normalize the question text - convert all escaped brackets to regular brackets
    // and handle any line breaks properly
    const processedQuestion = question.question
      .replace(/\\n/g, '\n')
      .replace(/\\([[\]])/g, '$1');
    
    // Regex to find placeholders like [option_set1] or [key_name]
    const placeholderRegex = /\[([^\]]+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = placeholderRegex.exec(processedQuestion)) !== null) {
      // Add text before the placeholder
      if (match.index > lastIndex) {
        parts.push(processedQuestion.substring(lastIndex, match.index));
      }
      // Add the placeholder object
      parts.push({ placeholder: match[1] }); // match[1] is the content inside brackets
      lastIndex = placeholderRegex.lastIndex;
    }

    // Add any remaining text after the last placeholder
    if (lastIndex < processedQuestion.length) {
      parts.push(processedQuestion.substring(lastIndex));
    }
    return parts;
  }, [question.question]);

  if (!question || !question.placeholderTargets || !question.options) {
    return <p className="text-red-500">Error: Dropdown question data is incomplete.</p>;
  }
  
  const allDropdownOptions = question.options || [];

  return (
    <div className="text-lg whitespace-pre-line">
      {/* This component renders the full question text with dropdown fields inline.
          The QuestionCard is configured to hide the standard question display for
          dropdown_selection question types to prevent duplication. */}
      <h2 className="text-xl md:text-2xl font-bold text-custom-dark-blue mb-6 relative inline-block pb-1.5">
        Fill in the blanks
        <span className="absolute left-0 bottom-0 w-10 h-0.5 bg-custom-primary rounded-rounded-full"></span>
      </h2>
      {parsedQuestionParts.map((part, index) => {
        if (typeof part === 'string') {
          // Just render the text as is - whitespace-pre-line CSS will handle line breaks
          return <React.Fragment key={`${index}`}>{part}</React.Fragment>;
        } else {
          const placeholderKey = part.placeholder;
          const currentSelectedText = currentSelections[placeholderKey];
          let borderColor = 'border-gray-300'; // Default border

          if (isSubmitted && showCorrectAnswer) {
            const correctAnswerText = question.placeholderTargets[placeholderKey]?.correctOptionText;
            if (correctAnswerText && currentSelectedText === correctAnswerText) {
              borderColor = 'border-green-500'; // Correct
            } else {
              borderColor = 'border-red-500'; // Incorrect
            }
          } else if (isSubmitted && !showCorrectAnswer && currentSelectedText !== null) {
            // If submitted but not showing correct answer yet (e.g. immediate feedback without revealing)
            // and user has made a selection, show a neutral "answered" border.
            borderColor = 'border-custom-blue'; 
          }

          return (
            <select
              key={`${placeholderKey}-${index}`}
              value={currentSelectedText || ""} // Ensure controlled component, default to empty string for "Select..."
              onChange={(e) => handleSelectChange(placeholderKey, e.target.value === "" ? null : e.target.value)}
              disabled={isSubmitted && showCorrectAnswer} // Disable after showing correct answer
              className={`inline-block mx-1 px-2 py-1 border-2 rounded-md shadow-sm focus:ring-custom-blue focus:border-custom-blue text-base ${borderColor} bg-white`}
              aria-label={`Selection for ${placeholderKey}`}
            >
              <option value="" disabled={currentSelectedText !== null && currentSelectedText !== ""}>Select...</option>
              {allDropdownOptions.map((opt: DropdownOption) => (
                <option key={opt.option_id} value={opt.text}>
                  {opt.text}
                </option>
              ))}
            </select>
          );
        }
      })}
      
      {/* Show in-progress validation message */}
      {autoValidating && allDropdownsFilled && !showCorrectAnswer && !isSubmitted && (
        <div className="mt-4 p-2 bg-yellow-100 border border-yellow-300 rounded">
          <p className="text-sm text-yellow-700">All dropdowns filled. Your answer will be submitted.</p>
        </div>
      )}
      
      {/* Show ready to submit message when all dropdowns filled */}
      {allDropdownsFilled && !autoValidating && !showCorrectAnswer && !isSubmitted && (
        <div className="mt-4 p-2 bg-green-100 border border-green-300 rounded">
          <p className="text-sm text-green-700">All dropdowns filled. Ready to submit.</p>
        </div>
      )}
      
      {isSubmitted && showCorrectAnswer && (
        <div className="mt-4 p-3 border rounded-md bg-gray-50">
          <h4 className="font-semibold text-md mb-2 text-custom-dark-blue">Correct Answers:</h4>
          <ul className="list-disc list-inside text-sm">
            {Object.entries(question.placeholderTargets).map(([key, target]) => (
              <li key={key} className="mb-1">
                <span className="font-medium">{`[${key}]`}:</span> {target.correctOptionText}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default memo(DropdownSelectionComponent);

import React, { useState, useEffect, useMemo, memo } from 'react';
import { DropdownSelectionQuestion, DropdownOption } from '../../../../types/quiz';
import { DropdownSelectionController } from '../../controllers/DropdownSelectionController';
import { useAutoValidation } from '../../hooks/useAutoValidation';

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
  // Create controller instance
  const controller = new DropdownSelectionController(question);
  
  // Initialize selections from placeholder keys
  const initialSelections = useMemo(() => {
    const selections: Record<string, string | null> = {};
    controller.getPlaceholderKeys().forEach(key => {
      selections[key] = selectedAnswer?.[key] || null;
    });
    return selections;
  }, [controller, selectedAnswer]);
  
  // Use auto-validation hook
  const [currentSelections, setCurrentSelections, autoValidating, allDropdownsFilled] = useAutoValidation<
    DropdownSelectionQuestion,
    Record<string, string | null>
  >(
    controller,
    initialSelections,
    onAnswerSelect,
    validateOnComplete
  );
  
  // Handle selection change for a placeholder
  const handleSelectChange = (placeholderKey: string, selectedOptionText: string | null) => {
    if (isSubmitted) return; // Don't allow changes after submission shown

    const newSelections = {
      ...currentSelections,
      [placeholderKey]: selectedOptionText,
    };
    
    setCurrentSelections(newSelections);
  };
  
  // Sync with external changes to selectedAnswer
  useEffect(() => {
    if (selectedAnswer && JSON.stringify(selectedAnswer) !== JSON.stringify(currentSelections)) {
      setCurrentSelections({...selectedAnswer});
    }
  }, [selectedAnswer]);

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
            const correctAnswerText = controller.getCorrectOptionForPlaceholder(placeholderKey);
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
            {controller.getPlaceholderKeys().map((key) => (
              <li key={key} className="mb-1">
                <span className="font-medium">{`[${key}]`}:</span> {controller.getCorrectOptionForPlaceholder(key)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default memo(DropdownSelectionComponent);

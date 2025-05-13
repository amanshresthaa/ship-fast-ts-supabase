import React, { memo } from 'react';
import { DropdownSelectionQuestion, DropdownOption } from '../../../../types/quiz';
import { useDropdownSelection } from '../../hooks/useDropdownSelection';

interface DropdownSelectionComponentProps {
  question: DropdownSelectionQuestion;
  onAnswerSelect: (answer: Record<string, string | null>) => void;
  selectedAnswer?: Record<string, string | null> | null;
  isSubmitted?: boolean;
  showFeedback?: boolean;
  validateOnComplete?: boolean;
}

const DropdownSelectionComponent: React.FC<DropdownSelectionComponentProps> = memo(({
  question,
  onAnswerSelect,
  selectedAnswer,
  isSubmitted = false,
  showFeedback = false,
  validateOnComplete = true,
}) => {
  const {
    currentSelections,
    allDropdownsFilled,
    autoValidating,
    handleSelectChange,
    parsedQuestionParts,
    allDropdownOptions, // This is question.options from the hook
  } = useDropdownSelection({
    question,
    onAnswerSelect,
    selectedAnswer,
    isSubmitted,
    validateOnComplete,
  });

  if (!question || !question.placeholderTargets || !question.options) {
    return <div className="text-red-500">Error: Invalid question data for DropdownSelectionComponent.</div>;
  }

  return (
    <div className="text-lg whitespace-pre-line">
      {parsedQuestionParts.map((part: string | { placeholder: string }, index: number) => {
        if (typeof part === 'string') {
          return <span key={index}>{part}</span>;
        }
        const placeholderKey = part.placeholder;
        const currentOptionValue = currentSelections[placeholderKey] || ''; // This is the selected text

        let selectClassName = "border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50";
        if (isSubmitted && showFeedback) {
          const correctTextForPlaceholder = question.placeholderTargets[placeholderKey]?.correctOptionText;
          if (currentOptionValue === correctTextForPlaceholder) {
            selectClassName = "border-green-500 ring-2 ring-green-300 rounded-md shadow-sm bg-green-50";
          } else {
            selectClassName = "border-red-500 ring-2 ring-red-300 rounded-md shadow-sm bg-red-50";
          }
        }

        return (
          <select
            key={index}
            value={currentOptionValue} // Value is the text of the selected option
            onChange={(e) => handleSelectChange(placeholderKey, e.target.value || null)}
            disabled={isSubmitted}
            className={`mx-1 p-2 text-base ${selectClassName}`}
            aria-label={`Select answer for ${placeholderKey}`}
          >
            <option value="">Select...</option>
            {allDropdownOptions.map((option: DropdownOption) => (
              <option key={option.option_id} value={option.text}> {/* Value is option.text */}
                {option.text}
              </option>
            ))}
          </select>
        );
      })}

      {autoValidating && allDropdownsFilled && !showFeedback && !isSubmitted && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-300 text-blue-700 rounded-md">
          <p className="font-semibold">Checking answer...</p>
        </div>
      )}

      {allDropdownsFilled && !autoValidating && !showFeedback && !isSubmitted && !validateOnComplete && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-md">
          <p className="font-semibold">All dropdowns filled. Proceed to next step or submit.</p>
        </div>
      )}

      {isSubmitted && showFeedback && (
        <div className={`mt-4 p-3 border rounded-md bg-opacity-10 
          ${
            Object.keys(currentSelections).length > 0 && // Ensure there are selections to check
            Object.entries(currentSelections).every(([key, selectedValue]) => {
              const correctText = question.placeholderTargets[key]?.correctOptionText;
              return correctText !== undefined && selectedValue === correctText;
            })
              ? 'bg-green-500 border-green-600 text-green-700' 
              : 'bg-red-500 border-red-600 text-red-700'}`}
        >
          <p className="font-semibold">
            {Object.keys(currentSelections).length > 0 &&
             Object.entries(currentSelections).every(([key, selectedValue]) => {
                const correctText = question.placeholderTargets[key]?.correctOptionText;
                return correctText !== undefined && selectedValue === correctText;
              })
              ? "All selections are correct!"
              : "Some selections are incorrect. Review the highlighted answers."}
          </p>
        </div>
      )}
    </div>
  );
});

DropdownSelectionComponent.displayName = 'DropdownSelectionComponent';
export default DropdownSelectionComponent;

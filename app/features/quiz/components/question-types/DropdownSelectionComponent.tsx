// app/features/quiz/components/question-types/DropdownSelectionComponent.tsx
import React, { useMemo, memo } from 'react';
import { DropdownSelectionQuestion, DropdownOption } from '../../../../types/quiz';
import { DropdownSelectionController } from '../../controllers/DropdownSelectionController';
import { useAutoValidation } from '../../hooks/useAutoValidation';

interface DropdownSelectionComponentProps {
  question: DropdownSelectionQuestion;
  onAnswerSelect: (answer: Record<string, string | null>) => void;
  selectedAnswer?: Record<string, string | null> | null;
  isSubmitted?: boolean;
  showCorrectAnswer?: boolean;
  validateOnComplete?: boolean;
}

const DropdownSelectionComponent: React.FC<DropdownSelectionComponentProps> = ({
  question,
  onAnswerSelect,
  selectedAnswer,
  isSubmitted = false,
  showCorrectAnswer = false,
  validateOnComplete = true,
}) => {
  const controller = new DropdownSelectionController(question);
  
  const initialSelections = useMemo(() => {
    const selections: Record<string, string | null> = {};
    controller.getPlaceholderKeys().forEach(key => {
      selections[key] = selectedAnswer?.[key] || null;
    });
    return selections;
  }, [controller, selectedAnswer]);
  
  const [currentSelections, setCurrentSelectionsInternal, autoValidating, allDropdownsFilled] = useAutoValidation<
    DropdownSelectionQuestion,
    Record<string, string | null>
  >(
    controller,
    initialSelections,
    onAnswerSelect,
    validateOnComplete
  );
  
  const handleSelectChange = (placeholderKey: string, selectedOptionText: string | null) => {
    if (isSubmitted && showCorrectAnswer) return;

    const newSelections = {
      ...currentSelections,
      [placeholderKey]: selectedOptionText,
    };
    
    setCurrentSelectionsInternal(newSelections);
    
    // Check if this selection completes the answer, and if so, directly call onAnswerSelect
    // This is consistent with the SingleSelectionComponent and YesNoComponent behavior
    const isAnswerComplete = controller.isAnswerComplete(newSelections);
    if (isAnswerComplete && validateOnComplete) {
      onAnswerSelect(newSelections);
    }
  };
  
  const parsedQuestionParts = useMemo(() => {
    const parts: (string | { placeholder: string })[] = [];
    if (!question.question) return parts;

    const processedQuestion = question.question
      .replace(/\\n/g, '\n') // Ensure newline characters are rendered
      .replace(/\\([[\\]])/g, '$1'); // Handle escaped brackets if any
    
    // Regex to find placeholders like [key_name] or [option_set1]
    const placeholderRegex = /\[([a-zA-Z0-9_]+)\]/g; 
    let lastIndex = 0;
    let match;

    while ((match = placeholderRegex.exec(processedQuestion)) !== null) {
      if (match.index > lastIndex) {
        parts.push(processedQuestion.substring(lastIndex, match.index));
      }
      parts.push({ placeholder: match[1] });
      lastIndex = placeholderRegex.lastIndex;
    }

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
      <h2 className="text-xl md:text-2xl font-bold text-custom-dark-blue mb-6 relative inline-block pb-1.5">
        Fill in the blanks
        <span className="absolute left-0 bottom-0 w-10 h-0.5 bg-custom-primary rounded-rounded-full"></span>
      </h2>
      {parsedQuestionParts.map((part, index) => {
        if (typeof part === 'string') {
          return <React.Fragment key={`${index}-text`}>{part}</React.Fragment>;
        } else {
          const placeholderKey = part.placeholder;
          const currentSelectedText = currentSelections[placeholderKey];
          let borderColor = 'border-gray-300';

          if (isSubmitted && showCorrectAnswer) {
            const correctAnswerText = controller.getCorrectOptionForPlaceholder(placeholderKey);
            borderColor = (correctAnswerText && currentSelectedText === correctAnswerText) ? 'border-green-500' : 'border-red-500';
          } else if (currentSelectedText !== null && currentSelectedText !== "" && currentSelectedText !== undefined) {
            borderColor = 'border-custom-primary'; 
          }

          return (
            <select
              key={`${placeholderKey}-${index}-select`}
              value={currentSelectedText || ""}
              onChange={(e) => handleSelectChange(placeholderKey, e.target.value === "" ? null : e.target.value)}
              disabled={isSubmitted && showCorrectAnswer}
              className={`inline-block mx-1 px-2 py-1 border-2 rounded-md shadow-sm focus:ring-custom-blue focus:border-custom-blue text-base ${borderColor} bg-white`}
              aria-label={`Selection for ${placeholderKey}`}
            >
              <option value="" disabled={currentSelectedText !== null && currentSelectedText !== "" && currentSelectedText !== undefined}>Select...</option>
              {allDropdownOptions.map((opt: DropdownOption) => (
                <option key={opt.option_id} value={opt.text}>
                  {opt.text}
                </option>
              ))}
            </select>
          );
        }
      })}
      
      {autoValidating && allDropdownsFilled && !showCorrectAnswer && !isSubmitted && (
        <div className="mt-4 p-2 bg-yellow-100 border border-yellow-300 rounded">
          <p className="text-sm text-yellow-700">All dropdowns filled. Your answer will be submitted.</p>
        </div>
      )}
      
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
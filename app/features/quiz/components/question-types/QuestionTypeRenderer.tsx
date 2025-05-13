import React, { memo } from 'react';
import { AnyQuestion, SingleSelectionQuestion, MultiChoiceQuestion, DragAndDropQuestion } from '../../../../types/quiz';
import SingleSelectionComponent from './SingleSelectionComponent';
import MultiChoiceComponent from './MultiChoiceComponent';
import DragAndDropQuestionComponent from './DragAndDropQuestionComponent';

interface QuestionTypeRendererProps {
  question: AnyQuestion;
  onAnswerSelect: (answer: any) => void;
  selectedAnswer: any;
  isSubmitted: boolean;
  showFeedback: boolean; // Standardized prop name (was shouldApplyFeedbackStyling)
  isQuizReviewMode: boolean; // New prop
}

// Using Factory pattern to render appropriate component based on question type
const QuestionTypeRenderer: React.FC<QuestionTypeRendererProps> = ({
  question,
  onAnswerSelect,
  selectedAnswer,
  isSubmitted,
  showFeedback, // Updated prop name
  isQuizReviewMode, // New prop
}) => {
  // Type guard to check if question is defined
  if (!question || !question.type) {
    return (
      <div className="p-4 my-4 border border-red-200 rounded bg-red-50">
        <p className="font-semibold text-red-700">Error: Invalid question object</p>
      </div>
    );
  }

  switch (question.type) {
    case 'single_selection':
      return (
        <SingleSelectionComponent 
          question={question as SingleSelectionQuestion} 
          onAnswerSelect={onAnswerSelect}
          selectedOptionId={selectedAnswer as string | undefined}
          isSubmitted={isSubmitted}
          showFeedback={showFeedback} // Pass standardized prop
        />
      );
    case 'multi':
      return (
        <MultiChoiceComponent
          question={question as MultiChoiceQuestion}
          onAnswerSelect={onAnswerSelect}
          selectedOptionIds={selectedAnswer as string[] | undefined}
          isSubmitted={isSubmitted}
          showFeedback={showFeedback} // Pass standardized prop
        />
      );
    case 'drag_and_drop':
      return (
        <DragAndDropQuestionComponent
          question={question as DragAndDropQuestion}
          onAnswerChange={onAnswerSelect}
          userAnswer={selectedAnswer as Record<string, string | null> | undefined}
          isSubmitted={isSubmitted}
<<<<<<< HEAD
          showFeedback={showFeedback} // Pass standardized prop (was showFeedbackStyling)
          isQuizReviewMode={isQuizReviewMode}
          validateOnDrop={true} // Assuming this remains true, or make it configurable if needed
        />
      );
    case 'dropdown_selection':
      return (
        <DropdownSelectionComponent
          question={question as DropdownSelectionQuestion}
          onAnswerSelect={onAnswerSelect}
          selectedAnswer={selectedAnswer as Record<string, string | null> | undefined | null}
          isSubmitted={isSubmitted}
          showFeedback={showFeedback} // Pass standardized prop (was showCorrectAnswer)
          validateOnComplete={true}
          // isQuizReviewMode is not currently used by DropdownSelectionComponent
=======
          showFeedbackStyling={shouldApplyFeedbackStyling} // Pass renamed prop here
          isQuizReviewMode={isQuizReviewMode} // Pass new prop here
          validateOnDrop={true} // Enable immediate feedback validation
>>>>>>> parent of 8d100cc (Added Dropdown Selection)
        />
      );
    default:
      return (
        <div className="p-4 my-4 border border-red-200 rounded bg-red-50">
          <p className="font-semibold text-red-700">Error: Unknown question type: {(question as any).type}</p>
        </div>
      );
  }
};

// Memoize the component to prevent unnecessary re-renders
export default memo(QuestionTypeRenderer);

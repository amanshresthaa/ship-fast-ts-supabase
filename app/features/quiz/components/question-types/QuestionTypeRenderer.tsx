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
  shouldApplyFeedbackStyling: boolean; // Renamed from showCorrectAnswer
  isQuizReviewMode: boolean; // New prop
}

// Using Factory pattern to render appropriate component based on question type
const QuestionTypeRenderer: React.FC<QuestionTypeRendererProps> = ({
  question,
  onAnswerSelect,
  selectedAnswer,
  isSubmitted,
  shouldApplyFeedbackStyling, // Updated prop name
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
          showCorrectAnswer={shouldApplyFeedbackStyling} // Pass renamed prop
        />
      );
    case 'multi':
      return (
        <MultiChoiceComponent
          question={question as MultiChoiceQuestion}
          onAnswerSelect={onAnswerSelect}
          selectedOptionIds={selectedAnswer as string[] | undefined}
          isSubmitted={isSubmitted}
          showCorrectAnswer={shouldApplyFeedbackStyling} // Pass renamed prop
        />
      );
    case 'drag_and_drop':
      return (
        <DragAndDropQuestionComponent
          question={question as DragAndDropQuestion}
          onAnswerChange={onAnswerSelect}
          userAnswer={selectedAnswer as Record<string, string | null> | undefined}
          isSubmitted={isSubmitted}
          showFeedbackStyling={shouldApplyFeedbackStyling} // Pass renamed prop here
          isQuizReviewMode={isQuizReviewMode} // Pass new prop here
          validateOnDrop={true} // Enable immediate feedback validation
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

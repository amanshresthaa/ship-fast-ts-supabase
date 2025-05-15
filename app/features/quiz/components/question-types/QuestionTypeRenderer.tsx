import React, { memo } from 'react';
import { AnyQuestion, SingleSelectionQuestion, MultiChoiceQuestion, DragAndDropQuestion, DropdownSelectionQuestion, OrderQuestion, YesNoQuestion, YesNoMultiQuestion } from '../../../../types/quiz';
import SingleSelectionComponent from './SingleSelectionComponent';
import MultiChoiceComponent from './MultiChoiceComponent';
import DragAndDropQuestionComponent from './DragAndDropQuestionComponent';
import DropdownSelectionComponent from './DropdownSelectionComponent';
import YesNoComponent from './YesNoComponent';
import YesNoMultiComponent from './YesNoMultiComponent';
import OrderQuestionComponent from './OrderQuestionComponent';
import { createQuestionController } from '../../controllers/QuestionControllerFactory';

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
  
  // Create controller using factory (this will be used in future components)
  try {
    createQuestionController(question);
  } catch (err) {
    console.log('Controller not yet available for this question type:', question.type);
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
          onAnswerChange={onAnswerSelect} // Note: prop name is onAnswerChange here
          userAnswer={selectedAnswer as Record<string, string | null> | undefined}
          isSubmitted={isSubmitted}
          showFeedbackStyling={shouldApplyFeedbackStyling}
          isQuizReviewMode={isQuizReviewMode}
          validateOnDrop={true}
        />
      );
    case 'dropdown_selection': // Add new case for dropdown_selection
      return (
        <DropdownSelectionComponent
          question={question as DropdownSelectionQuestion}
          onAnswerSelect={onAnswerSelect} // Prop name is onAnswerSelect
          selectedAnswer={selectedAnswer as Record<string, string | null> | undefined | null} // Corrected prop name to selectedAnswer
          isSubmitted={isSubmitted}
          showCorrectAnswer={shouldApplyFeedbackStyling}
          validateOnComplete={true} // Add the new prop to wait for all dropdowns to be filled
          // isQuizReviewMode prop is not used by DropdownSelectionComponent, so it's removed for now.
          // If needed later, it can be added to DropdownSelectionComponentProps.
        />
      );
    case 'order':
      return (
        <OrderQuestionComponent
          question={question as OrderQuestion}
          onAnswerSelect={onAnswerSelect}
          userAnswer={selectedAnswer as Record<string, string | null> | undefined}
          isSubmitted={isSubmitted}
          showCorrectAnswer={shouldApplyFeedbackStyling}
          isQuizReviewMode={isQuizReviewMode}
          validateOnComplete={true}
        />
      );
    case 'yes_no':
      return (
        <YesNoComponent
          key={question.id}
          question={question as YesNoQuestion}
          onAnswerSelect={onAnswerSelect}
          selectedAnswer={selectedAnswer as boolean | undefined}
          isSubmitted={isSubmitted}
          showCorrectAnswer={shouldApplyFeedbackStyling}
        />
      );
    case 'yesno_multi':
      return (
        <YesNoMultiComponent
          key={question.id}
          question={question as YesNoMultiQuestion}
          onAnswerSelect={onAnswerSelect}
          selectedAnswers={selectedAnswer as boolean[] | undefined}
          isSubmitted={isSubmitted}
          showCorrectAnswer={shouldApplyFeedbackStyling}
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

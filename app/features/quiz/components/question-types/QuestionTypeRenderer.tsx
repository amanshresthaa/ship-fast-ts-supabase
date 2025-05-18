import React, { memo, useEffect, lazy, Suspense } from 'react';
import { AnyQuestion, SingleSelectionQuestion, MultiChoiceQuestion, DragAndDropQuestion, DropdownSelectionQuestion, OrderQuestion, YesNoQuestion, YesNoMultiQuestion } from '../../../../types/quiz';
import { createQuestionController } from '../../controllers/QuestionControllerFactory';

// Lazy load components for code splitting
const SingleSelectionComponent = lazy(() => import('./SingleSelectionComponent'));
const MultiChoiceComponent = lazy(() => import('./MultiChoiceComponent'));
const DragAndDropQuestionComponent = lazy(() => import('./DragAndDropQuestionComponent'));
const DropdownSelectionComponent = lazy(() => import('./DropdownSelectionComponent'));
const YesNoComponent = lazy(() => import('./YesNoComponent'));
const YesNoMultiComponent = lazy(() => import('./YesNoMultiComponent'));
const OrderQuestionComponent = lazy(() => import('./OrderQuestionComponent'));

// Loading fallback for lazy-loaded components
const QuestionLoading: React.FC = () => (
  <div className="animate-pulse space-y-4 my-4">
    <div className="h-10 bg-gray-200 rounded w-3/4"></div>
    <div className="h-14 bg-gray-200 rounded w-full"></div>
    <div className="h-14 bg-gray-200 rounded w-full"></div>
    <div className="h-14 bg-gray-200 rounded w-full"></div>
  </div>
);

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
  // Debug trace of props for feedback-related questions
  useEffect(() => {
    if (question && (question.type === 'single_selection' || question.type === 'multi')) {
      console.log(`QuestionTypeRenderer (${question.type}) - props:`, {
        id: question.id,
        isSubmitted,
        shouldApplyFeedbackStyling,
        isQuizReviewMode
      });
    }
  }, [question, isSubmitted, shouldApplyFeedbackStyling, isQuizReviewMode]);

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
        <Suspense fallback={<QuestionLoading />}>
          <SingleSelectionComponent
            question={question as SingleSelectionQuestion}
            onAnswerSelect={onAnswerSelect}
            selectedOptionId={selectedAnswer as string | undefined}
            isSubmitted={isSubmitted}
            showCorrectAnswer={shouldApplyFeedbackStyling} // Pass renamed prop
          />
        </Suspense>
      );
    case 'multi':
      return (
        <Suspense fallback={<QuestionLoading />}>
          <MultiChoiceComponent
            question={question as MultiChoiceQuestion}
            onAnswerSelect={onAnswerSelect}
            selectedOptionIds={selectedAnswer as string[] | undefined}
            isSubmitted={isSubmitted}
            showCorrectAnswer={shouldApplyFeedbackStyling} // Pass renamed prop
          />
        </Suspense>
      );
    case 'drag_and_drop':
      return (
        <Suspense fallback={<QuestionLoading />}>
          <DragAndDropQuestionComponent
            question={question as DragAndDropQuestion}
            onAnswerChange={onAnswerSelect} // Note: prop name is onAnswerChange here
            userAnswer={selectedAnswer as Record<string, string | null> | undefined}
            isSubmitted={isSubmitted}
            showFeedbackStyling={shouldApplyFeedbackStyling}
            isQuizReviewMode={isQuizReviewMode}
            validateOnDrop={true}
          />
        </Suspense>
      );
    case 'dropdown_selection': // Add new case for dropdown_selection
      return (
        <Suspense fallback={<QuestionLoading />}>
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
        </Suspense>
      );
    case 'order':
      return (
        <Suspense fallback={<QuestionLoading />}>
          <OrderQuestionComponent
            question={question as OrderQuestion}
            onAnswerSelect={onAnswerSelect}
            userAnswer={selectedAnswer as Record<string, string | null> | undefined}
            isSubmitted={isSubmitted}
            showCorrectAnswer={shouldApplyFeedbackStyling}
            isQuizReviewMode={isQuizReviewMode}
            validateOnComplete={true}
          />
        </Suspense>
      );
    case 'yes_no':
      return (
        <Suspense fallback={<QuestionLoading />}>
          <YesNoComponent
            key={question.id}
            question={question as YesNoQuestion}
            onAnswerSelect={onAnswerSelect}
            selectedAnswer={selectedAnswer as boolean | undefined}
            isSubmitted={isSubmitted}
            showCorrectAnswer={shouldApplyFeedbackStyling}
          />
        </Suspense>
      );
    case 'yesno_multi':
      return (
        <Suspense fallback={<QuestionLoading />}>
          <YesNoMultiComponent
            key={question.id}
            question={question as YesNoMultiQuestion}
            onAnswerSelect={onAnswerSelect}
            selectedAnswers={selectedAnswer as boolean[] | undefined}
            isSubmitted={isSubmitted}
            showCorrectAnswer={shouldApplyFeedbackStyling}
          />
        </Suspense>
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

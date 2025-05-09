import React, { memo } from 'react';
import { AnyQuestion, SingleSelectionQuestion } from '../../../../types/quiz';
import SingleSelectionComponent from './SingleSelectionComponent';

interface QuestionTypeRendererProps {
  question: AnyQuestion;
  onAnswerSelect: (answer: any) => void;
  selectedAnswer: any;
  isSubmitted: boolean;
  showCorrectAnswer: boolean;
}

// Using Factory pattern to render appropriate component based on question type
const QuestionTypeRenderer: React.FC<QuestionTypeRendererProps> = ({
  question,
  onAnswerSelect,
  selectedAnswer,
  isSubmitted,
  showCorrectAnswer,
}) => {
  switch (question.type) {
    case 'single_selection':
      return (
        <SingleSelectionComponent 
          question={question as SingleSelectionQuestion} 
          onAnswerSelect={onAnswerSelect}
          selectedOptionId={selectedAnswer as string | undefined}
          isSubmitted={isSubmitted}
          showCorrectAnswer={showCorrectAnswer}
        />
      );
    // Add other question type cases as they are implemented
    // case 'multi':
    //   return <MultiChoiceComponent ... />;
    // case 'drag_and_drop':
    //   return <DragAndDropComponent ... />;
    default:
      return (
        <div className="p-4 my-4 border border-red-200 rounded bg-red-50">
          <p className="font-semibold text-red-700">Error: Unknown question type: {question.type}</p>
        </div>
      );
  }
};

// Memoize the component to prevent unnecessary re-renders
export default memo(QuestionTypeRenderer);

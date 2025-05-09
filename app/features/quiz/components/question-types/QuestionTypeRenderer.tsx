import React, { memo } from 'react';
import { AnyQuestion, SingleSelectionQuestion, MultiChoiceQuestion } from '../../../../types/quiz';
import SingleSelectionComponent from './SingleSelectionComponent';
import MultiChoiceComponent from './MultiChoiceComponent';

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
  // Ensure question has a valid type property
  const questionType = question.type as string;
  
  switch (questionType) {
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
    case 'multi':
      return (
        <MultiChoiceComponent
          question={question as MultiChoiceQuestion}
          onAnswerSelect={onAnswerSelect}
          selectedOptionIds={selectedAnswer as string[] | undefined}
          isSubmitted={isSubmitted}
          showCorrectAnswer={showCorrectAnswer}
        />
      );
    // Add other question type cases as they are implemented
    // case 'drag_and_drop':
    //   return <DragAndDropComponent ... />;
    default:
      return (
        <div className="p-4 my-4 border border-red-200 rounded bg-red-50">
          <p className="font-semibold text-red-700">Error: Unknown question type: {questionType}</p>
        </div>
      );
  }
};

// Memoize the component to prevent unnecessary re-renders
export default memo(QuestionTypeRenderer);

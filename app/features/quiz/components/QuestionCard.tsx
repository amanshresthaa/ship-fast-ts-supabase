// app/features/quiz/components/QuestionCard.tsx
'use client';

import React, { useCallback, useMemo, memo } from 'react';
import { AnyQuestion } from '../../../types/quiz';
import { useQuiz } from '../context/QuizContext';
import QuestionHeader from '../components/QuestionHeader';
import QuestionContent from '../components/QuestionContent';
import FeedbackSection from '../components/FeedbackSection';
import QuestionTypeRenderer from './question-types/QuestionTypeRenderer';

interface QuestionCardProps {
  question: AnyQuestion;
}

const QuestionCard: React.FC<QuestionCardProps> = memo(({ question }) => {
  const { state, submitAndScoreAnswer } = useQuiz();
  
  // Use useMemo for derived state from context to prevent unnecessary recalculations
  const userAnswerDetails = useMemo(() => 
    state.userAnswers[question.id], 
    [state.userAnswers, question.id]
  );
  
  // selectedAnswerForThisQuestion is the answer already processed or null/undefined if not answered.
  const selectedAnswerForThisQuestion = useMemo(() => 
    userAnswerDetails?.answer, 
    [userAnswerDetails]
  );

  const isSubmittedForThisQuestion = userAnswerDetails !== undefined;
  
  const shouldApplyFeedbackStyling = useMemo(() => 
    state.isQuizComplete || (state.showFeedbackForCurrentQuestion && isSubmittedForThisQuestion),
    [state.isQuizComplete, state.showFeedbackForCurrentQuestion, isSubmittedForThisQuestion]
  );
    
  const handleAnswerSubmission = useCallback(async (answerPayload: any) => {
    // The answerPayload received here is already deemed "complete" by the child component's 
    // useAutoValidation hook (for types like multi-choice, dropdown, order)
    // or it's an immediate selection (for single_selection, yes_no).
    
    // A guard to prevent re-submission if the exact same answer is submitted again,
    // or if already fully processed (isCorrect is defined).
    if (isSubmittedForThisQuestion && 
        userAnswerDetails?.isCorrect !== undefined &&
        JSON.stringify(userAnswerDetails.answer) === JSON.stringify(answerPayload)
    ) {
        // Potentially, if isCorrect is undefined, it means server validation is pending.
        // We might allow resubmission if the answer changes.
        // For now, if it's submitted and has a correctness status, and answer is same, don't re-process.
        // console.log("QuestionCard: Answer already submitted and scored. Payload:", answerPayload);
        // return; // This might be too aggressive if we want to allow changing mind before next Q.
                  // The `hasSubmittedRef` in useAutoValidation should handle most cases of duplicate calls
                  // for the exact same answer instance.
    }

    await submitAndScoreAnswer(question, answerPayload);
  }, [isSubmittedForThisQuestion, userAnswerDetails, submitAndScoreAnswer, question]);

  // Memoize the feedback sections to prevent unnecessary re-renders
  const explanationFeedback = useMemo(() => {
    if (((state.showFeedbackForCurrentQuestion && isSubmittedForThisQuestion) || state.isQuizComplete) && 
         question.explanation) {
      return (
        <FeedbackSection 
          type="explanation" 
          content={question.explanation} 
        />
      );
    }
    return null;
  }, [state.showFeedbackForCurrentQuestion, isSubmittedForThisQuestion, state.isQuizComplete, question.explanation]);

  const answerFeedback = useMemo(() => {
    if (state.showFeedbackForCurrentQuestion && 
        isSubmittedForThisQuestion && 
        userAnswerDetails?.isCorrect !== undefined) {
      return (
        <FeedbackSection
          type={userAnswerDetails.isCorrect ? "correct" : "incorrect"}
          content={userAnswerDetails.isCorrect 
            ? question.feedback_correct 
            : question.feedback_incorrect
          }
        />
      );
    }
    return null;
  }, [state.showFeedbackForCurrentQuestion, isSubmittedForThisQuestion, userAnswerDetails, question.feedback_correct, question.feedback_incorrect]);

  return (
    <div className="bg-white rounded-rounded-lg-ref shadow-shadow-strong p-7 md:p-10 mb-8 relative overflow-hidden animate-card-appear">
      <div className="card-decoration absolute top-0 right-0 w-24 h-24 md:w-36 md:h-36 bg-primary-gradient opacity-5 rounded-bl-full z-0"></div>

      <div className="relative z-10">
        <QuestionHeader 
          points={question.points} 
          difficulty={question.difficulty} 
        />

        {question.type !== 'dropdown_selection' && (
          <QuestionContent question={question.question} />
        )}
        
        <QuestionTypeRenderer
          key={question.id} 
          question={question}
          onAnswerSelect={handleAnswerSubmission}
          selectedAnswer={selectedAnswerForThisQuestion}
          isSubmitted={isSubmittedForThisQuestion}
          shouldApplyFeedbackStyling={shouldApplyFeedbackStyling}
          isQuizReviewMode={state.isQuizComplete}
        />

        {explanationFeedback}
        {answerFeedback}
      </div>
    </div>
  );
});

export default QuestionCard;
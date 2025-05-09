'use client';

import React from 'react';
import { AnyQuestion } from '../../../types/quiz';
import { useQuiz } from '../context/QuizContext';
import QuestionHeader from './QuestionHeader';
import QuestionContent from './QuestionContent';
import FeedbackSection from './FeedbackSection';
import QuestionTypeRenderer from './question-types/QuestionTypeRenderer';

interface QuestionCardProps {
  question: AnyQuestion;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const { state, submitAndScoreAnswer } = useQuiz();

  const userAnswerDetails = state.userAnswers[question.id];
  const selectedAnswerForThisQuestion = userAnswerDetails?.answer;
  const isSubmittedForThisQuestion = userAnswerDetails !== undefined;
  const showCorrectAnswerStyling = state.isQuizComplete || 
    (state.showFeedbackForCurrentQuestion && isSubmittedForThisQuestion);

  const handleLocalAnswerSelection = async (answerPayload: any) => {
    if (isSubmittedForThisQuestion && userAnswerDetails.isCorrect !== undefined) return;
    await submitAndScoreAnswer(question, answerPayload);
  };

  return (
    <div className="bg-white rounded-rounded-lg-ref shadow-shadow-strong p-7 md:p-10 mb-8 relative overflow-hidden animate-card-appear">
      {/* Card Decoration */}
      <div className="card-decoration absolute top-0 right-0 w-24 h-24 md:w-36 md:h-36 bg-primary-gradient opacity-5 rounded-bl-full z-0"></div>

      <div className="relative z-10">
        {/* Question Metadata */}
        <QuestionHeader 
          points={question.points} 
          difficulty={question.difficulty} 
        />

        {/* Question Content */}
        <QuestionContent question={question.question} />
        
        {/* Question Type-specific Component */}
        <QuestionTypeRenderer
          question={question}
          onAnswerSelect={handleLocalAnswerSelection}
          selectedAnswer={selectedAnswerForThisQuestion}
          isSubmitted={isSubmittedForThisQuestion}
          showCorrectAnswer={showCorrectAnswerStyling}
        />

        {/* Explanation Box */}
        {((state.showFeedbackForCurrentQuestion && isSubmittedForThisQuestion) || state.isQuizComplete) && 
          question.explanation && (
            <FeedbackSection 
              type="explanation" 
              content={question.explanation} 
            />
        )}
        
        {/* Feedback Message Box (Correct/Incorrect) */}
        {state.showFeedbackForCurrentQuestion && 
         isSubmittedForThisQuestion && 
         userAnswerDetails?.isCorrect !== undefined && (
          <FeedbackSection
            type={userAnswerDetails.isCorrect ? "correct" : "incorrect"}
            content={userAnswerDetails.isCorrect 
              ? question.feedback_correct 
              : question.feedback_incorrect
            }
          />
        )}
      </div>
    </div>
  );
};

export default QuestionCard;

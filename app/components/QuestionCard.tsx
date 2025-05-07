'use client';

import React from 'react';
import { AnyQuestion, SingleSelectionQuestion, BaseQuestion } from '../types/quiz';
import SingleSelectionComponent from './question-types/SingleSelectionComponent';
import { useQuiz } from '../context/QuizContext';
// TODO: Import other question type components as they are created

interface QuestionCardProps {
  question: AnyQuestion;
  // Removed props that will now come from context: 
  // onAnswerSelect, selectedAnswer, isSubmitted, showCorrectAnswer
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const { state, dispatch, submitAndScoreAnswer } = useQuiz();

  const userAnswerDetails = state.userAnswers[question.id];
  const selectedAnswerForThisQuestion = userAnswerDetails?.answer;
  const isSubmittedForThisQuestion = userAnswerDetails !== undefined;
  // Show correct answer styling if quiz is complete OR (feedback is shown AND answer is submitted)
  const showCorrectAnswerStyling = state.isQuizComplete || (state.showFeedbackForCurrentQuestion && isSubmittedForThisQuestion);

  const handleLocalAnswerSelection = async (answerPayload: any) => {
    // Prevent re-submission if already submitted and scored, or if no scoring function
    if (isSubmittedForThisQuestion && userAnswerDetails.isCorrect !== undefined) {
      console.log('Answer already submitted and scored.');
      return;
    }
    if (!submitAndScoreAnswer) {
        console.error("submitAndScoreAnswer function not available from QuizContext");
        return;
    }

    // The question object here is AnyQuestion, but submitAndScoreAnswer expects BaseQuestion.
    // This is fine as AnyQuestion extends BaseQuestion.
    await submitAndScoreAnswer(question as BaseQuestion, answerPayload);
  };

  const renderQuestionType = () => {
    switch (question.type) {
      case 'single_selection':
        return (
          <SingleSelectionComponent 
            question={question as SingleSelectionQuestion} 
            onAnswerSelect={(optionId) => {
              handleLocalAnswerSelection(optionId);
            }}
            selectedOptionId={selectedAnswerForThisQuestion as string | undefined}
            isSubmitted={isSubmittedForThisQuestion}
            showCorrectAnswer={showCorrectAnswerStyling}
          />
        );
      // TODO: Add cases for other question types as they are implemented
      // case 'multi':
      //   return <MultiChoiceComponent question={question} />;
      default:
        return (
          <div className="p-4 my-4 border border-red-200 rounded bg-red-50">
            <p className="font-semibold text-red-700">Error: Unknown question type: {question.type}</p>
          </div>
        );
    }
  };

  // Use the server-verified isCorrect from userAnswers if available, otherwise it's undefined.
  const isCorrectServerVerified = userAnswerDetails?.isCorrect;

  return (
    <div className="p-6 my-4 bg-white border border-gray-200 rounded-lg shadow-md">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Question 
          {/* TODO: state.currentQuestionIndex + 1 of state.questions.length */}
        </h2>
        <p className="mt-1 text-sm text-gray-500">Points: {question.points} | Difficulty: {question.difficulty}</p>
        <p className="mt-2 text-lg text-gray-700 whitespace-pre-wrap">{question.question}</p>
      </div>

      {renderQuestionType()}

      {/* Explanation: Shown if the question is submitted and feedback is active, or if quiz is complete, and an explanation exists */}
      {( (state.showFeedbackForCurrentQuestion && isSubmittedForThisQuestion) || state.isQuizComplete) && question.explanation && (
        <div className="mt-4 p-3 rounded bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-700">Explanation:</h3>
          <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{question.explanation}</p>
        </div>
      )}
      
      {/* Feedback Message: Shown if feedback mode is active for the current question, 
          it has been submitted, AND we have a server-verified correctness status */}
      {state.showFeedbackForCurrentQuestion && isSubmittedForThisQuestion && isCorrectServerVerified !== undefined && (
          <div className={`mt-4 p-3 rounded ${ isCorrectServerVerified ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
            <p className={`font-semibold ${ isCorrectServerVerified ? 'text-green-700' : 'text-red-700'}`}>
              { isCorrectServerVerified ? question.feedback_correct : question.feedback_incorrect }
            </p>
          </div>
        )}
    </div>
  );
};

export default QuestionCard; 
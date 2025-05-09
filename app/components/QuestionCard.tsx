'use client';

import React from 'react';
import { AnyQuestion, SingleSelectionQuestion, MultiChoiceQuestion, BaseQuestion } from '../types/quiz';
import { useQuiz } from '../features/quiz/context/QuizContext';
import QuestionTypeRenderer from '../features/quiz/components/question-types/QuestionTypeRenderer';
// TODO: Import other question type components as they are created

// Import an SVG icon for the feedback box, or use a character
const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-custom-error">
    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" fill="currentColor"/>
  </svg>
);
const CheckCircleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-custom-success">
        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l6.06-6.061L15.65 8.527 11.003 13.17l-2.12-2.121L7.47 12.461l3.533 3.539z" fill="currentColor" />
    </svg>
);

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
    if (isSubmittedForThisQuestion && userAnswerDetails.isCorrect !== undefined) return;
    if (!submitAndScoreAnswer) return;
    // Explicitly cast question to AnyQuestion to satisfy linter, though it should already be inferred
    await submitAndScoreAnswer(question as AnyQuestion, answerPayload);
  };

  const renderQuestionType = () => {
    return (
      <QuestionTypeRenderer
        question={question}
        onAnswerSelect={(answer) => handleLocalAnswerSelection(answer)}
        selectedAnswer={selectedAnswerForThisQuestion}
        isSubmitted={isSubmittedForThisQuestion}
        showCorrectAnswer={showCorrectAnswerStyling}
      />
    );
  };

  // Use the server-verified isCorrect from userAnswers if available, otherwise it's undefined.
  const isCorrectServerVerified = userAnswerDetails?.isCorrect;
  const difficultyText = question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1);

  // Determine feedback box styles
  let feedbackBoxBorderColor = 'border-custom-error';
  let feedbackBoxBgColor = 'bg-red-500/[.05]'; // using custom error with opacity
  let feedbackBoxTextColor = 'text-custom-error';
  let FeedbackIcon = InfoIcon;

  if (isCorrectServerVerified === true) {
    feedbackBoxBorderColor = 'border-custom-success';
    feedbackBoxBgColor = 'bg-green-500/[.05]'; // using custom success with opacity
    feedbackBoxTextColor = 'text-custom-success';
    FeedbackIcon = CheckCircleIcon;
  }

  return (
    // Applying .question-card styles and animation
    <div className="bg-white rounded-rounded-lg-ref shadow-shadow-strong p-7 md:p-10 mb-8 relative overflow-hidden animate-card-appear">
      {/* Card Decoration - simplified with Tailwind */}
      <div className="card-decoration absolute top-0 right-0 w-24 h-24 md:w-36 md:h-36 bg-primary-gradient opacity-5 rounded-bl-full z-0"></div>

      <div className="relative z-10"> {/* Content wrapper for z-indexing above decoration */}
        <div className="question-meta flex flex-col sm:flex-row gap-3 mb-6">
          <div className="meta-badge inline-flex items-center py-1.5 px-4 rounded-rounded-full font-semibold text-sm shadow-shadow-1 bg-custom-primary/[.1] text-custom-primary border-l-4 border-custom-primary">
            Points: {question.points}
          </div>
          <div className={`meta-badge inline-flex items-center py-1.5 px-4 rounded-rounded-full font-semibold text-sm shadow-shadow-1 bg-yellow-500/[.1] text-yellow-600 border-l-4 border-yellow-500`}>
            Difficulty: {difficultyText}
          </div>
        </div>

        <section className="question-section">
          <h2 className="text-xl md:text-2xl font-bold text-custom-dark-blue mb-6 relative inline-block pb-1.5">
            Question
            <span className="absolute left-0 bottom-0 w-10 h-0.5 bg-custom-primary rounded-rounded-full"></span>
          </h2>
          <div className="question-text text-base md:text-lg text-custom-gray-1 mb-6 whitespace-pre-wrap">
            {question.question} 
            {/* TODO: If question has requirements list or specific prompt, render here */}
          </div>
        </section>

        {renderQuestionType()}

        {/* Explanation Box - styled like feedback but neutral */}
        {((state.showFeedbackForCurrentQuestion && isSubmittedForThisQuestion) || state.isQuizComplete) && question.explanation && (
          <div className="feedback-box bg-blue-500/[.05] border-custom-primary border-l-4 rounded-rounded-md-ref p-5 mt-6 shadow-shadow-1 animate-fade-in-up">
            <h3 className="feedback-header flex items-center gap-2 mb-2 font-bold text-custom-primary text-lg">
              {/* Optional: Icon for explanation */}
              Explanation:
            </h3>
            <div className="feedback-content text-custom-gray-1 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {question.explanation}
            </div>
          </div>
        )}
        
        {/* Feedback Message Box (Correct/Incorrect) */}
        {state.showFeedbackForCurrentQuestion && isSubmittedForThisQuestion && isCorrectServerVerified !== undefined && (
            <div className={`feedback-box ${feedbackBoxBgColor} ${feedbackBoxBorderColor} border-l-4 rounded-rounded-md-ref p-5 mt-6 shadow-shadow-1 animate-fade-in-up`}>
              <div className={`feedback-header flex items-center gap-2 mb-2 font-bold ${feedbackBoxTextColor} text-lg`}>
                <FeedbackIcon />
                { isCorrectServerVerified ? question.feedback_correct.split('!')[0] : question.feedback_incorrect.split('!')[0] }!
              </div>
              <div className="feedback-content text-custom-gray-1 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {/* Show the rest of the feedback message if it exists after the first sentence */}
                { isCorrectServerVerified ? question.feedback_correct.split('!').slice(1).join('!').trim() : question.feedback_incorrect.split('!').slice(1).join('!').trim() }
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default QuestionCard; 
import React from 'react';
import { QuizQuestion } from '../types/question-types';
import { formatTime } from '../utils/formatting';

interface QuestionSectionProps {
  /** The current question to display */
  question: QuizQuestion;
  /** Current question index (0-based) */
  currentIndex: number;
  /** Total number of questions */
  totalQuestions: number;
  /** Time limit in seconds (0 for no limit) */
  timeLimit?: number;
  /** Time remaining in seconds */
  timeRemaining?: number;
  /** Whether the quiz is currently paused */
  isPaused?: boolean;
  /** Callback when the user selects an answer */
  onAnswerSelect: (answer: any) => void;
  /** Callback when the user navigates to a different question */
  onQuestionNavigate: (index: number) => void;
  /** Callback when the user submits the current answer */
  onSubmit: () => void;
  /** Whether to show the correct/incorrect feedback */
  showFeedback?: boolean;
  /** The user's answer to the current question */
  userAnswer?: any;
  /** Whether the answer was correct (for feedback) */
  isAnswerCorrect?: boolean;
  /** Optional class name for the container */
  className?: string;
}

/**
 * Displays the current question and handles answer selection and submission.
 * Renders different question types using appropriate subcomponents.
 */
const QuestionSection: React.FC<QuestionSectionProps> = ({
  question,
  currentIndex,
  totalQuestions,
  timeLimit,
  timeRemaining,
  isPaused = false,
  onAnswerSelect,
  onQuestionNavigate,
  onSubmit,
  showFeedback = false,
  userAnswer,
  isAnswerCorrect,
  className = '',
}) => {
  const handleAnswerChange = (answer: any) => {
    onAnswerSelect(answer);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  // Render different question types
  const renderQuestionContent = () => {
    switch (question.type) {
      case 'single_selection':
        return (
          <SingleChoiceQuestion
            question={question}
            selectedAnswer={userAnswer}
            onChange={handleAnswerChange}
            showFeedback={showFeedback}
            isCorrect={isAnswerCorrect}
          />
        );
      case 'multi_selection':
        return (
          <MultipleChoiceQuestion
            question={question}
            selectedAnswers={userAnswer || []}
            onChange={handleAnswerChange}
            showFeedback={showFeedback}
            isCorrect={isAnswerCorrect}
          />
        );
      case 'true_false':
      case 'yes_no':
        return (
          <TrueFalseQuestion
            question={question}
            selectedAnswer={userAnswer}
            onChange={handleAnswerChange}
            showFeedback={showFeedback}
            isCorrect={isAnswerCorrect}
          />
        );
      case 'short_answer':
        return (
          <ShortAnswerQuestion
            question={question}
            answer={userAnswer || ''}
            onChange={handleAnswerChange}
            showFeedback={showFeedback}
            isCorrect={isAnswerCorrect}
          />
        );
      // Add cases for other question types as needed
      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <section 
      className={`question-section bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}
      aria-labelledby={`question-${question.id}-title`}
    >
      {/* Question Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center mb-2">
          <h2 
            id={`question-${question.id}-title`}
            className="text-lg font-medium text-gray-900"
          >
            Question {currentIndex + 1} of {totalQuestions}
          </h2>
          {timeLimit && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-1">Time remaining:</span>
              <span className="font-medium">
                {formatTime(timeRemaining || 0)}
              </span>
            </div>
          )}
        </div>
        {isPaused && (
          <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md inline-flex items-center">
            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Quiz Paused
          </div>
        )}
      </div>

      {/* Question Content */}
      <div className="p-6">
        <div 
          className="question-text text-gray-800 mb-6 text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: question.text || '' }}
        />
        
        <form onSubmit={handleSubmit}>
          {renderQuestionContent()}
          
          <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={userAnswer === undefined || userAnswer === null || userAnswer === ''}
            >
              {currentIndex < totalQuestions - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        </form>
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className={`px-6 py-4 border-t ${
          isAnswerCorrect 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start">
            <div className={`flex-shrink-0 ${
              isAnswerCorrect ? 'text-green-500' : 'text-red-500'
            }`}>
              {isAnswerCorrect ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                isAnswerCorrect ? 'text-green-800' : 'text-red-800'
              }`}>
                {isAnswerCorrect ? 'Correct!' : 'Incorrect'}
              </h3>
              {question.explanation && (
                <div className="mt-1 text-sm text-gray-600">
                  {question.explanation}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default QuestionSection;

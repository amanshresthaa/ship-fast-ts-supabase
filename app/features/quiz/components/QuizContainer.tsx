import React, { useEffect } from 'react';
import { useQuiz } from '../hooks/useQuiz';
import { QuizHeader } from './QuizHeader';
import { QuizProgress } from './QuizProgress';
import { QuestionSection } from './QuestionSection';
import { QuizNavigation } from './QuizNavigation';
import { QuizResults } from './QuizResults';
import { QuizLoading } from './QuizLoading';
import { QuizError } from './QuizError';
import { QuizPaused } from './QuizPaused';
import { QuizStart } from './QuizStart';
import { QuizProvider } from '../context/v2/QuizContext';
import { QuizQuestion } from '../types';

interface QuizContainerProps {
  questions: QuizQuestion[];
  quizId: string;
  title?: string;
  description?: string;
  onComplete?: (results: any) => void;
  config?: {
    showProgressBar?: boolean;
    showQuestionNumbers?: boolean;
    showTimer?: boolean;
    allowBackNavigation?: boolean;
    allowQuestionReview?: boolean;
    autoAdvance?: boolean;
    timeLimit?: number; // in minutes
    passingScore?: number; // percentage
    [key: string]: any;
  };
  className?: string;
  children?: React.ReactNode;
}

/**
 * Quiz Container Component
 * The main container for the quiz that handles the overall layout and state management
 */
const QuizContainer: React.FC<QuizContainerProps> = ({
  questions,
  quizId,
  title = 'Quiz',
  description = '',
  onComplete,
  config = {},
  className = '',
  children,
}) => {
  return (
    <QuizProvider quizId={quizId} questions={questions} config={config} onComplete={onComplete}>
      <QuizContent 
        title={title} 
        description={description} 
        className={className}
      >
        {children}
      </QuizContent>
    </QuizProvider>
  );
};

// Internal component that uses the QuizContext
const QuizContent: React.FC<{
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}> = ({ title, description, className, children }) => {
  const {
    // State
    currentQuestion,
    currentQuestionNumber,
    totalQuestions,
    progress,
    score,
    isLastQuestion,
    isFirstQuestion,
    isStarted,
    isCompleted,
    isPaused,
    error,
    timeRemaining,
    
    // Actions
    startQuiz,
    submitAnswer,
    submitQuiz,
    nextQuestion,
    previousQuestion,
    navigateToQuestion,
    togglePause,
    flagQuestion,
  } = useQuiz();

  // Auto-start the quiz if configured
  useEffect(() => {
    if (!isStarted && !isCompleted) {
      startQuiz();
    }
  }, [isStarted, isCompleted, startQuiz]);

  // Handle quiz completion when all questions are answered
  useEffect(() => {
    if (isCompleted && onComplete) {
      onComplete({
        score,
        totalQuestions,
        correctAnswers: Math.round((score / 100) * totalQuestions),
      });
    }
  }, [isCompleted, onComplete, score, totalQuestions]);

  // Render loading state
  if (!currentQuestion) {
    return <QuizLoading />;
  }

  // Render error state
  if (error) {
    return <QuizError error={error} onRetry={startQuiz} />;
  }

  // Render start screen
  if (!isStarted) {
    return (
      <QuizStart 
        title={title}
        description={description}
        totalQuestions={totalQuestions}
        onStart={startQuiz}
      />
    );
  }

  // Render paused state
  if (isPaused) {
    return (
      <QuizPaused 
        onResume={togglePause}
        timeRemaining={timeRemaining}
      />
    );
  }

  // Render results screen
  if (isCompleted) {
    return (
      <QuizResults 
        score={score}
        totalQuestions={totalQuestions}
        timeSpent={0} // This would come from state
        onRestart={() => window.location.reload()} // Simple restart for now
      />
    );
  }

  // Render main quiz interface
  return (
    <div className={`quiz-container ${className}`}>
      <QuizHeader 
        title={title}
        questionNumber={currentQuestionNumber}
        totalQuestions={totalQuestions}
        timeRemaining={timeRemaining}
        onPause={togglePause}
      />
      
      <QuizProgress 
        progress={progress}
        currentQuestion={currentQuestionNumber}
        totalQuestions={totalQuestions}
      />
      
      <QuestionSection 
        question={currentQuestion}
        questionNumber={currentQuestionNumber}
        totalQuestions={totalQuestions}
        onSubmit={submitAnswer}
        onFlagToggle={(flagged) => flagQuestion(currentQuestion.id, flagged)}
        isFlagged={false} // This would come from state
      />
      
      <QuizNavigation 
        isFirstQuestion={isFirstQuestion}
        isLastQuestion={isLastQuestion}
        onNext={nextQuestion}
        onPrevious={previousQuestion}
        onSubmit={isLastQuestion ? submitQuiz : undefined}
        submitLabel={isLastQuestion ? 'Submit Quiz' : undefined}
      />
      
      {children}
    </div>
  );
};

export { QuizContainer };

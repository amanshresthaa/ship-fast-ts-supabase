'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuiz } from '../context/QuizContext';
import { QuizService } from '../services/quizService';
import { QuizProgressService } from '../services/quizProgressService';
import QuestionCard from '../components/QuestionCard';
import QuizCompletionSummary from '../components/QuizCompletionSummary';
import { useQuizAutoSave } from '@/app/hooks/useQuizAutoSave';
import { ResumeQuizPrompt } from '../components/ResumeQuizPrompt';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { HelpModal } from '../components/HelpModal';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useResponsive } from '@/app/hooks/useResponsive';
import { ResponsiveQuizLayout } from '../components/ResponsiveQuizLayout';
import { cn } from '@/lib/utils';

const QuizPageContent: React.FC<{ quizId: string; questionType?: string }> = ({ quizId, questionType }) => {
  const { state, dispatch } = useQuiz();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showMobileQuickJump, setShowMobileQuickJump] = useState(false);
  const supabase = createClientComponentClient();
  
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // Quiz timer setup
  const { timeLeft, isExpired, pause, resume } = useQuizTimer({
    initialTimeInMinutes: 60,
    autoSubmitOnExpiry: true,
    onTimeExpired: () => {
      dispatch({ type: 'COMPLETE_QUIZ' });
    }
  });

  // Handle question types from URL
  const typesParam = searchParams.get('types');
  const effectiveQuestionTypes = typesParam ? typesParam.split(',') : (questionType ? [questionType] : undefined);
  const effectiveQuestionType = effectiveQuestionTypes?.length === 1 ? effectiveQuestionTypes[0] : undefined;

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
  }, [supabase]);

  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState<{
    currentQuestionIndex: number;
    userAnswers: any;
    lastSavedAt?: Date;
  } | null>(null);

  // Initialize auto-save
  const { forceSave } = useQuizAutoSave(!!user);

  // Quiz control handlers
  const handleQuizSubmit = () => setShowSubmitConfirmation(true);
  const confirmQuizSubmit = () => {
    dispatch({ type: 'COMPLETE_QUIZ' });
    setShowSubmitConfirmation(false);
  };
  const cancelQuizSubmit = () => setShowSubmitConfirmation(false);
  const handleShowHelp = () => setShowHelpModal(true);
  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  
  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 80));
  const resetZoom = () => setZoomLevel(100);

  // Handle save and exit
  const handleSaveAndExit = () => {
    console.log('Saving quiz progress...', {
      userAnswers: state.userAnswers,
      currentQuestionIndex: state.currentQuestionIndex,
      timeSpent: 60 * 60 - (timeLeft ? timeLeft.split(':').reduce((acc, time) => (60 * acc) + +time, 0) : 0)
    });
    
    if (confirm('Are you sure you want to save and exit? Your progress will be saved and you can resume later.')) {
      window.history.back();
    }
  };

  // Loading state
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading quiz</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{state.error}</p>
              </div>
              <div className="mt-4">
                <a href="/quizzes" className="text-sm font-medium text-red-700 hover:text-red-600">
                  &larr; Back to quizzes
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz completion state
  if (state.isCompleted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <QuizCompletionSummary 
          quiz={state.quiz} 
          userAnswers={state.userAnswers} 
          questions={state.questions}
          onRestart={() => dispatch({ type: 'RESTART_QUIZ' })}
          onReview={() => dispatch({ type: 'REVIEW_QUIZ' })}
        />
      </div>
    );
  }

  // Main quiz interface
  return (
    <ResponsiveQuizLayout
      quizId={quizId}
      user={user}
      effectiveQuestionTypes={effectiveQuestionTypes}
      effectiveQuestionType={effectiveQuestionType}
      isSidebarOpen={isSidebarOpen}
      onSidebarOpenChange={setIsSidebarOpen}
      className={cn(
        'transition-colors duration-300',
        isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'
      )}
    >
      {/* Main Quiz Content */}
      <div 
        className={cn(
          'max-w-4xl mx-auto w-full',
          'transition-all duration-200',
          'origin-top'
        )}
        style={{
          transform: `scale(${zoomLevel/100})`,
          transformOrigin: 'top',
          width: '100%',
          maxWidth: '100%',
          padding: isMobile ? '1rem' : '2rem',
        }}
      >
        <QuestionCard 
          question={state.questions[state.currentQuestionIndex]} 
          questionNumber={state.currentQuestionIndex + 1}
          totalQuestions={state.questions.length}
          userAnswer={state.userAnswers[state.currentQuestionIndex]}
          onAnswerSelect={(answer) => dispatch({ type: 'ANSWER_QUESTION', payload: answer })}
          isFlagged={state.flaggedQuestions.has(state.currentQuestionIndex)}
          onToggleFlag={() => dispatch({ type: 'TOGGLE_FLAG' })}
          showFeedback={state.showFeedback}
          isReviewMode={state.isReviewMode}
          onNextQuestion={() => dispatch({ type: 'NEXT_QUESTION' })}
          onPreviousQuestion={() => dispatch({ type: 'PREVIOUS_QUESTION' })}
          onSubmitQuiz={handleQuizSubmit}
          isLastQuestion={state.currentQuestionIndex === state.questions.length - 1}
          isFirstQuestion={state.currentQuestionIndex === 0}
          quizType={state.quiz?.type}
        />
      </div>

      {/* Mobile Quiz Footer */}
      <footer className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => dispatch({ type: 'PREVIOUS_QUESTION' })}
            disabled={state.currentQuestionIndex === 0}
            className={cn(
              'p-2 rounded-full',
              state.currentQuestionIndex === 0 
                ? 'text-gray-400 dark:text-gray-600' 
                : 'text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={() => setShowMobileQuickJump(true)}
            className="text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {state.currentQuestionIndex + 1} / {state.questions.length}
          </button>
          
          {state.currentQuestionIndex < state.questions.length - 1 ? (
            <button
              onClick={() => dispatch({ type: 'NEXT_QUESTION' })}
              className="p-2 rounded-full text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleQuizSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Submit
            </button>
          )}
        </div>
      </footer>

      {/* Submit Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showSubmitConfirmation}
        title="Submit Quiz"
        message="Are you sure you want to submit your quiz? You won't be able to make changes after submission."
        confirmText="Submit Quiz"
        cancelText="Cancel"
        onConfirm={confirmQuizSubmit}
        onCancel={cancelQuizSubmit}
      />

      {/* Help Modal */}
      <HelpModal 
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </ResponsiveQuizLayout>
  );
};

// Main Quiz Page Component that can be used directly
const QuizPage = (props: { params: { quizId: string } }) => {
  return <QuizPageContent quizId={props.params.quizId} />;
};

export default QuizPage;

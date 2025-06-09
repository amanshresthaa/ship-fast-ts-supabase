'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuiz } from '../context/QuizContext';
import { QuizService } from '../services/quizService';
import { QuizProgressService } from '../services/quizProgressService';
import QuestionCard from '../components/QuestionCard';
import QuizProgress from '../components/QuizProgress';
import QuizNavigation from '../components/QuizNavigation';
import QuizCompletionSummary from '../components/QuizCompletionSummary';
import QuizHeader from '../components/QuizHeader';
import { useQuizAutoSave } from '@/app/hooks/useQuizAutoSave';
import { ResumeQuizPrompt } from '../components/ResumeQuizPrompt';
import { SaveStatusIndicator } from '../components/SaveStatusIndicator';
import LeftSidebar from '../components/LeftSidebar'; // <-- Import LeftSidebar
import QuizFooter from '../components/QuizFooter'; // <-- Import QuizFooter
import { MobileSidebarToggle } from '../components/MobileSidebarToggle'; // <-- Import MobileSidebarToggle
import MobileQuizStats from '../components/MobileQuizStats'; // <-- Import MobileQuizStats
import { useQuizTimer } from '../hooks/useQuizTimer'; // <-- Import useQuizTimer
import { ConfirmationDialog } from '../components/ConfirmationDialog'; // <-- Import ConfirmationDialog
import { HelpModal } from '../components/HelpModal'; // <-- Import HelpModal
// Using the session hook that works in this project
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useResponsive } from '@/app/hooks/useResponsive';

// Learning Mode Quiz Runner Component
const QuizPageContent: React.FC<{ quizId: string; questionType?: string }> = ({ quizId, questionType }) => {
  const { state, dispatch } = useQuiz();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100); // Zoom level in percentage
  const [isDarkMode, setIsDarkMode] = useState(false); // Dark mode state
  const [showMobileQuickJump, setShowMobileQuickJump] = useState(false); // Mobile quick jump modal
  const supabase = createClientComponentClient();
  
  // Responsive utilities
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    deviceType, 
    isTouchDevice, 
    screenWidth,
    breakpoint 
  } = useResponsive();
  
  // Initialize timer with 60 minutes (can be made configurable)
  const { timeLeft, isExpired, pause, resume } = useQuizTimer({
    initialTimeInMinutes: 60,
    autoSubmitOnExpiry: true,
    onTimeExpired: () => {
      // Auto-submit quiz when time expires
      dispatch({ type: 'COMPLETE_QUIZ' });
    }
  });
  
  // Handle quiz submission
  const handleQuizSubmit = () => {
    setShowSubmitConfirmation(true);
  };
  
  const confirmQuizSubmit = () => {
    dispatch({ type: 'COMPLETE_QUIZ' });
    setShowSubmitConfirmation(false);
  };
  
  const cancelQuizSubmit = () => {
    setShowSubmitConfirmation(false);
  };
  
  // Handle help modal
  const handleShowHelp = () => {
    setShowHelpModal(true);
  };
  
  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 150)); // Max 150%
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 80)); // Min 80%
  };
  
  const resetZoom = () => {
    setZoomLevel(100);
  };
  
  // Handle dark mode toggle
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };
  
  // Handle save and exit
  const handleSaveAndExit = () => {
    // Save current progress (this would typically save to backend)
    console.log('Saving quiz progress...', {
      userAnswers: state.userAnswers,
      currentQuestionIndex: state.currentQuestionIndex,
      flaggedQuestions: Array.from(state.flaggedQuestions),
      timeSpent: 60 * 60 - (timeLeft ? timeLeft.split(':').reduce((acc, time) => (60 * acc) + +time, 0) : 0)
    });
    
    // Navigate back or show confirmation
    if (confirm('Are you sure you want to save and exit? Your progress will be saved and you can resume later.')) {
      // This would typically navigate to dashboard or quiz list
      window.history.back();
    }
  };
  
  // Handle multiple question types from URL parameters
  const typesParam = searchParams.get('types');
  const effectiveQuestionTypes = typesParam ? typesParam.split(',') : (questionType ? [questionType] : undefined);
  
  // For backwards compatibility, convert array back to string for single type
  const effectiveQuestionType = effectiveQuestionTypes && effectiveQuestionTypes.length === 1 ? effectiveQuestionTypes[0] : undefined;
  
  // Get the authenticated user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
    // Only run once on mount - supabase client doesn't need to be a dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState<{
    currentQuestionIndex: number;
    userAnswers: any;
    lastSavedAt?: Date;
  } | null>(null);

  // Initialize auto-save hook
  const { forceSave } = useQuizAutoSave(!!user);

  // Keep track of the last loaded quiz to prevent re-running effect unnecessarily
  const lastLoadedQuizRef = useRef({ quizId: '', questionTypes: '', userId: '' });
  
  // Memoize loadProgress function to prevent it from causing re-renders
  const memoizedLoadProgress = useCallback(QuizProgressService.loadProgress, []);
  
  // Load quiz data and check for existing progress when component mounts or important params change
  useEffect(() => {
    // Create a string representation of questionTypes for comparison
    const questionTypesStr = effectiveQuestionTypes ? effectiveQuestionTypes.join(',') : '';
    
    // Skip if nothing important has changed
    const currentUserId = user?.id || '';
    if (
      quizId === lastLoadedQuizRef.current.quizId &&
      questionTypesStr === lastLoadedQuizRef.current.questionTypes &&
      currentUserId === lastLoadedQuizRef.current.userId
    ) {
      return;
    }
    
    // Update the ref with current values to track what we've loaded
    lastLoadedQuizRef.current = {
      quizId: quizId || '',
      questionTypes: questionTypesStr,
      userId: currentUserId,
    };
    
    const loadQuizAndProgress = async () => {
      if (!quizId) return;
      
      dispatch({ type: 'LOAD_QUIZ_START' });
      
      try {
        // First check for existing progress if user is authenticated
        let progress = null;
        if (user) {
          progress = await memoizedLoadProgress(quizId, effectiveQuestionType);
          
          if (progress) {
            // Save progress data to show the resume prompt
            setSavedProgress({
              ...progress,
              lastSavedAt: new Date(), // This would ideally come from the API
            });
            setShowResumePrompt(true);
          }
        }

        // Load the quiz data with multiple question types support
        const quizData = await QuizService.fetchQuizById(quizId, effectiveQuestionTypes);
        dispatch({ type: 'LOAD_QUIZ_SUCCESS', payload: quizData });
        
        // If we're showing the resume prompt, don't apply progress yet
        // It will be applied when the user clicks "Resume"
      } catch (error: any) {
        console.error("Error fetching quiz data:", error);
        dispatch({ 
          type: 'LOAD_QUIZ_FAILURE', 
          payload: error.message || 'Error fetching learning mode quiz.' 
        });
      }
    };
    
    loadQuizAndProgress();
  }, [quizId, effectiveQuestionTypes, user, dispatch, memoizedLoadProgress]);

  // Handle resuming quiz from saved progress
  const handleResumeQuiz = () => {
    if (savedProgress) {
      dispatch({ 
        type: 'RESTORE_QUIZ_PROGRESS', 
        payload: {
          currentQuestionIndex: savedProgress.currentQuestionIndex,
          userAnswers: savedProgress.userAnswers
        }
      });
    }
    setShowResumePrompt(false);
  };

  // Handle restarting quiz from the beginning
  const handleRestartQuiz = async () => {
    // Delete the saved progress first
    if (user) {
      await QuizProgressService.deleteProgress(quizId, effectiveQuestionType);
    }
    
    // Reset the quiz state
    dispatch({ type: 'RESET_QUIZ' });
    setShowResumePrompt(false);
  };

  // Loading states
  if (state.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-custom-light-bg">
        <p className="text-xl text-custom-dark-blue">Loading learning mode quiz...</p>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-custom-light-bg">
        <p className="text-xl text-custom-error">Error: {state.error}</p>
      </div>
    );
  }

  // No quiz data
  if (!state.quiz) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-custom-light-bg">
        <p className="text-xl text-custom-dark-blue">Quiz not found.</p>
      </div>
    );
  }
  
  // Quiz loaded but no questions match the filter
  if (state.questions.length === 0) {
    return (
      <div className="min-h-screen bg-custom-light-bg py-6 px-4 md:px-6">
        <div className="quiz-container max-w-3xl mx-auto">
          <header className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-custom-dark-blue mb-3 relative inline-block pb-2">
              {state.quiz.title}
              <span className="absolute left-1/4 bottom-0 w-1/2 h-1 bg-primary-gradient rounded-rounded-full"></span>
            </h1>
            
            {/* Filter by question type */}
            <div className="mb-6">
              <div className="flex flex-wrap justify-center gap-2 mb-2">
                <Link 
                  href={`/quiz/${quizId}`} 
                  className={`px-3 py-1 rounded-full text-sm ${!effectiveQuestionTypes || effectiveQuestionTypes.length > 1 ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  All Questions
                </Link>
                <Link 
                  href={`/quiz/${quizId}/type/single_selection`}
                  className={`px-3 py-1 rounded-full text-sm ${effectiveQuestionType === 'single_selection' ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  Single Selection
                </Link>
                {/* ... other question types ... */}
              </div>
            </div>
          </header>
          
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">No questions found</h2>
            <p>There are no questions available with this filter.</p>
            <Link href={`/quiz/${quizId}`} className="mt-4 inline-block text-custom-primary hover:underline">
              View all questions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get current question
  const currentQuestion = state.questions[state.currentQuestionIndex];
  
  // Responsive layout configuration
  const layoutConfig = {
    showSidebar: isDesktop && !isMobile, // Only show sidebar on desktop
    useBottomNavigation: isMobile, // Bottom navigation for mobile
    collapseHeader: isMobile, // Simplified header for mobile
    useDrawerPattern: isTablet || isMobile, // Use drawer pattern for tablet and mobile
    gridColumns: {
      'desktop-xl': 10,
      'desktop-large': 8,
      'desktop': 6,
      'tablet': 5,
      'mobile-large': 4,
      'mobile': 3
    }[breakpoint] || 6,
    touchTargetSize: isTouchDevice ? 'large' : 'normal',
    showCompactHeader: isMobile || isTablet,
    useFullWidthMain: isMobile,
    sidebarPosition: isMobile ? 'bottom' : 'right',
    questionSpacing: isMobile ? 'compact' : 'comfortable',
  };
  
  // If showing the resume prompt
  if (showResumePrompt && savedProgress) {
    return (
      <div className="min-h-screen bg-custom-light-bg py-6 px-4 md:px-6">
        <div className="quiz-container max-w-3xl mx-auto">
          <header className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-custom-dark-blue mb-3 relative inline-block pb-2">
              {state.quiz.title}
              <span className="absolute left-1/4 bottom-0 w-1/2 h-1 bg-primary-gradient rounded-rounded-full"></span>
            </h1>
          </header>
          
          <ResumeQuizPrompt
            lastSavedAt={savedProgress.lastSavedAt || new Date()}
            currentQuestionIndex={savedProgress.currentQuestionIndex}
            totalQuestions={state.questions.length}
            onResume={handleResumeQuiz}
            onRestart={handleRestartQuiz}
          />
        </div>
      </div>
    );
  }

  // Quiz is complete - Show summary
  if (state.isQuizComplete) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 md:px-6">
        <div className="quiz-container max-w-4xl mx-auto">
          <QuizHeader 
            quizId={quizId}
            user={user}
            effectiveQuestionTypes={effectiveQuestionTypes}
            effectiveQuestionType={effectiveQuestionType}
            showQuestionFilters={false}
            customActions={
              <div className="completion-badge bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-4 py-2 rounded-full text-sm font-semibold">
                ✅ Quiz Completed!
              </div>
            }
          />
          
          <QuizCompletionSummary quiz={state.quiz} />
        </div>
      </div>
    );
  }

  // Show the quiz
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'dark bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'
    }`}>
      {/* Top Navigation Bar */}
      <div className={`sticky top-0 z-50 backdrop-blur-sm border-b shadow-sm transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-900/95 border-gray-700' 
          : 'bg-white/95 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* Mobile Sidebar Toggle */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`xl:hidden p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors ${
                  layoutConfig.touchTargetSize === 'large' ? 'min-h-[44px] min-w-[44px]' : ''
                }`}
                aria-label="Open quiz overview"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <h1 className={`text-xl font-semibold text-gray-900 truncate ${
                layoutConfig.showCompactHeader ? 'max-w-40' : 'max-w-xs sm:max-w-sm'
              }`}>
                {state.quiz?.title || 'Quiz'}
              </h1>
              <div className={`${
                layoutConfig.showCompactHeader ? 'hidden' : 'hidden sm:flex'
              } items-center space-x-2`}>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                  Question {state.currentQuestionIndex + 1} of {state.questions.length}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{Math.round((Object.keys(state.userAnswers).length / state.questions.length) * 100)}% Complete</span>
                </span>
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-red-600">{timeLeft}</span>
                </span>
              </div>
              
              {/* Zoom Controls */}
              <div className="hidden lg:flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 80}
                  className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  title="Zoom Out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                </button>
                <button 
                  onClick={resetZoom}
                  className="px-2 py-1 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  title="Reset Zoom"
                >
                  {zoomLevel}%
                </button>
                <button 
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 150}
                  className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  title="Zoom In"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </button>
              </div>
              
              {/* Dark Mode Toggle */}
              <button 
                onClick={toggleDarkMode}
                className={`${
                  layoutConfig.touchTargetSize === 'large' ? 'p-3 min-h-[44px] min-w-[44px]' : 'p-2'
                } text-gray-400 hover:text-gray-600 transition-colors`}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              
              <button 
                onClick={handleShowHelp}
                className={`${
                  layoutConfig.touchTargetSize === 'large' ? 'p-3 min-h-[44px] min-w-[44px]' : 'p-2'
                } text-gray-400 hover:text-gray-600 transition-colors`}
                title="Help"
                aria-label="Show help guide"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${(Object.keys(state.userAnswers).length / state.questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Stats Bar */}
      <div className={`xl:hidden bg-white border-b border-gray-200 ${
        layoutConfig.useBottomNavigation ? 'pb-2' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1 text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium">{Object.keys(state.userAnswers).length} / {state.questions.length}</span>
              </span>
              <span className="text-gray-500 hidden sm:inline">
                {Math.round((Object.keys(state.userAnswers).length / state.questions.length) * 100)}% Complete
              </span>
            </div>
            <div className="flex items-center space-x-1 text-red-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{timeLeft}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${
        layoutConfig.useBottomNavigation ? 'pb-24' : ''
      }`}>
        <div className={`flex ${layoutConfig.useFullWidthMain ? 'flex-col' : 'flex-col xl:flex-row'} gap-8`}>
          
          {/* Main Question Area */}
          <div className={`flex-1 ${layoutConfig.useFullWidthMain ? 'w-full' : 'max-w-4xl'}`}>
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Question Header */}
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-8 py-6">
                <div className={`flex ${
                  layoutConfig.showCompactHeader ? 'flex-col gap-3' : 'flex-col sm:flex-row sm:items-center sm:justify-between gap-4'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                      <span className="text-white font-semibold text-sm">
                        Question {state.currentQuestionIndex + 1}
                      </span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-white text-xs font-medium uppercase tracking-wide">
                        {state.questions[state.currentQuestionIndex]?.difficulty || 'Medium'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => dispatch({ type: 'TOGGLE_FLAG_QUESTION', payload: currentQuestion.id })}
                      className={`bg-white/20 backdrop-blur-sm text-white ${
                        layoutConfig.touchTargetSize === 'large' ? 'px-5 py-3 min-h-[44px]' : 'px-4 py-2'
                      } rounded-full text-sm font-medium hover:bg-white/30 transition-colors flex items-center space-x-2 ${
                        state.flaggedQuestions.has(currentQuestion.id) ? 'bg-yellow-500/30' : ''
                      }`}
                      aria-label={state.flaggedQuestions.has(currentQuestion.id) ? 'Remove flag from question' : 'Flag question for review'}
                    >
                      <svg className="w-4 h-4" fill={state.flaggedQuestions.has(currentQuestion.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                      <span>{state.flaggedQuestions.has(currentQuestion.id) ? 'Unflag' : 'Flag'}</span>
                    </button>
                    
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                      <span className="text-white text-sm font-medium">
                        {state.questions[state.currentQuestionIndex]?.points || 1} pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div 
                className={`${
                  layoutConfig.questionSpacing === 'compact' ? 'px-6 py-6' : 'px-8 py-8'
                } transition-transform duration-200`}
                style={{ 
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center'
                }}
              >
                <QuestionCard question={currentQuestion} />
              </div>

              {/* Navigation Footer */}
              <div className={`bg-gray-50 ${
                layoutConfig.questionSpacing === 'compact' ? 'px-6 py-4' : 'px-8 py-6'
              } border-t border-gray-100`}>
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => dispatch({ type: 'PREVIOUS_QUESTION' })}
                    disabled={state.currentQuestionIndex === 0}
                    className={`flex items-center space-x-2 ${
                      layoutConfig.touchTargetSize === 'large' ? 'px-6 py-4 min-h-[44px]' : 'px-6 py-3'
                    } bg-white border border-gray-200 rounded-full text-gray-600 hover:text-gray-800 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md`}
                    aria-label="Go to previous question"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">Previous</span>
                  </button>

                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">
                      {state.currentQuestionIndex + 1} of {state.questions.length}
                    </span>
                  </div>

                  <button 
                    onClick={() => {
                      if (state.currentQuestionIndex === state.questions.length - 1) {
                        handleQuizSubmit();
                      } else {
                        dispatch({ type: 'NEXT_QUESTION' });
                      }
                    }}
                    className={`flex items-center space-x-2 ${
                      layoutConfig.touchTargetSize === 'large' ? 'px-6 py-4 min-h-[44px]' : 'px-6 py-3'
                    } bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105`}
                    aria-label={state.currentQuestionIndex === state.questions.length - 1 ? 'Submit quiz' : 'Go to next question'}
                  >
                    <span>{state.currentQuestionIndex === state.questions.length - 1 ? 'Submit Quiz' : 'Next'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Only show on desktop */}
          {layoutConfig.showSidebar && (
            <div className="xl:w-80 space-y-6">
            {/* Quiz Overview Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Quiz Overview</span>
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">
                      {Object.keys(state.userAnswers).length}
                    </div>
                    <div className="text-sm text-blue-600 font-medium">Answered</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">
                      {state.questions.length - Object.keys(state.userAnswers).length}
                    </div>
                    <div className="text-sm text-purple-600 font-medium">Remaining</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-xl">
                    <div className="text-2xl font-bold text-yellow-600">
                      {state.flaggedQuestions.size}
                    </div>
                    <div className="text-sm text-yellow-600 font-medium">Flagged</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Progress</span>
                    <span className="text-sm font-bold text-gray-900">
                      {Math.round((Object.keys(state.userAnswers).length / state.questions.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(Object.keys(state.userAnswers).length / state.questions.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Question Navigator */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Quick Jump</span>
                </h3>
              </div>
              <div className="p-6">
                <div className={`grid gap-1.5 ${
                  layoutConfig.gridColumns === 3 ? 'grid-cols-5' :
                  layoutConfig.gridColumns === 4 ? 'grid-cols-6' :
                  layoutConfig.gridColumns === 5 ? 'grid-cols-7' :
                  'grid-cols-8'
                }`}>
                  {state.questions.map((question, index) => {
                    const isAnswered = !!state.userAnswers[question.id];
                    const isCurrent = index === state.currentQuestionIndex;
                    const isCorrect = state.userAnswers[question.id]?.isCorrect;
                    const isFlagged = state.flaggedQuestions.has(question.id);
                    
                    return (
                      <button
                        key={question.id}
                        onClick={() => dispatch({ type: 'NAVIGATE_TO_QUESTION', payload: index })}
                        className={`
                          aspect-square rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 relative
                          ${isCurrent 
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg ring-2 ring-purple-300' 
                            : isAnswered
                              ? isCorrect 
                                ? 'bg-green-500 text-white shadow-md' 
                                : 'bg-red-500 text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm'
                          }
                        `}
                      >
                        {index + 1}
                        {isFlagged && (
                          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full border border-white">
                            <div className="w-0.5 h-0.5 bg-yellow-700 rounded-full absolute inset-0.5 m-auto"></div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 space-y-4">
                <button 
                  onClick={handleQuizSubmit}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  Submit Quiz
                </button>
                
                <button 
                  onClick={handleSaveAndExit}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
                >
                  Save & Exit
                </button>
                
                <div className="pt-4 border-t border-gray-100">
                  <div className="text-center text-sm text-gray-500">
                    <p>Need help?</p>
                    <button 
                      onClick={handleShowHelp}
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      View Help Guide
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {layoutConfig.useBottomNavigation && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="flex items-center justify-around py-3 px-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex flex-col items-center space-y-1 p-2 text-gray-600 hover:text-purple-600 transition-colors"
              aria-label="Open overview"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-xs font-medium">Overview</span>
            </button>
            
            <button
              onClick={() => dispatch({ type: 'PREVIOUS_QUESTION' })}
              disabled={state.currentQuestionIndex === 0}
              className="flex flex-col items-center space-y-1 p-2 text-gray-600 hover:text-purple-600 disabled:text-gray-400 disabled:opacity-50 transition-colors"
              aria-label="Previous question"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-xs font-medium">Previous</span>
            </button>
            
            <button
              onClick={() => dispatch({ type: 'TOGGLE_FLAG_QUESTION', payload: currentQuestion.id })}
              className={`flex flex-col items-center space-y-1 p-2 transition-colors ${
                state.flaggedQuestions.has(currentQuestion.id) 
                  ? 'text-yellow-600' 
                  : 'text-gray-600 hover:text-yellow-600'
              }`}
              aria-label={state.flaggedQuestions.has(currentQuestion.id) ? 'Remove flag' : 'Flag question'}
            >
              <svg className="w-6 h-6" fill={state.flaggedQuestions.has(currentQuestion.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              <span className="text-xs font-medium">Flag</span>
            </button>
            
            <button
              onClick={() => {
                if (state.currentQuestionIndex === state.questions.length - 1) {
                  handleQuizSubmit();
                } else {
                  dispatch({ type: 'NEXT_QUESTION' });
                }
              }}
              className="flex flex-col items-center space-y-1 p-2 text-purple-600 hover:text-purple-700 transition-colors"
              aria-label={state.currentQuestionIndex === state.questions.length - 1 ? 'Submit quiz' : 'Next question'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-xs font-medium">
                {state.currentQuestionIndex === state.questions.length - 1 ? 'Submit' : 'Next'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="xl:hidden fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quiz Overview</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-3 text-gray-400 hover:text-gray-600 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Close overview"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto h-full pb-24">
              {/* Quiz Overview Card */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">
                      {Object.keys(state.userAnswers).length}
                    </div>
                    <div className="text-sm text-blue-600 font-medium">Answered</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">
                      {state.questions.length - Object.keys(state.userAnswers).length}
                    </div>
                    <div className="text-sm text-purple-600 font-medium">Remaining</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-xl">
                    <div className="text-2xl font-bold text-yellow-600">
                      {state.flaggedQuestions.size}
                    </div>
                    <div className="text-sm text-yellow-600 font-medium">Flagged</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Progress</span>
                    <span className="text-sm font-bold text-gray-900">
                      {Math.round((Object.keys(state.userAnswers).length / state.questions.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(Object.keys(state.userAnswers).length / state.questions.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Question Navigator */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Quick Jump</span>
                  </h3>
                </div>
                
                <div className="p-4">
                  <div className={`grid gap-1.5 ${
                    isMobile ? 'grid-cols-5' : 'grid-cols-6'
                  }`}>
                    {state.questions.map((question, index) => {
                      const isAnswered = !!state.userAnswers[question.id];
                      const isCurrent = index === state.currentQuestionIndex;
                      const isCorrect = state.userAnswers[question.id]?.isCorrect;
                      const isFlagged = state.flaggedQuestions.has(question.id);
                      
                      return (
                        <button
                          key={question.id}
                          onClick={() => {
                            dispatch({ type: 'NAVIGATE_TO_QUESTION', payload: index });
                            setIsSidebarOpen(false);
                          }}
                          className={`
                            aspect-square rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 relative
                            ${isCurrent 
                              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg ring-2 ring-purple-300' 
                              : isAnswered
                                ? isCorrect 
                                  ? 'bg-green-500 text-white shadow-md' 
                                  : 'bg-red-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm'
                            }
                          `}
                        >
                          {index + 1}
                          {isFlagged && (
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full border border-white">
                              <div className="w-0.5 h-0.5 bg-yellow-700 rounded-full absolute inset-0.5 m-auto"></div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    handleQuizSubmit();
                    setIsSidebarOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 px-4 rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 min-h-[44px]"
                >
                  Submit Quiz
                </button>
                
                <button 
                  onClick={() => {
                    handleSaveAndExit();
                    setIsSidebarOpen(false);
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-4 px-4 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 min-h-[44px]"
                >
                  Save & Exit
                </button>
                
                <button 
                  onClick={() => {
                    handleShowHelp();
                    setIsSidebarOpen(false);
                  }}
                  className="w-full bg-blue-50 text-blue-600 py-4 px-4 rounded-xl font-medium hover:bg-blue-100 transition-all duration-200 border border-blue-200 min-h-[44px]"
                >
                  View Help Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showSubmitConfirmation}
        title="Submit Quiz"
        message={`Are you sure you want to submit your quiz? You have answered ${Object.keys(state.userAnswers).length} out of ${state.questions.length} questions. Once submitted, you cannot make any changes.`}
        confirmText="Submit Quiz"
        cancelText="Continue Quiz"
        confirmButtonVariant="primary"
        onConfirm={confirmQuizSubmit}
        onCancel={cancelQuizSubmit}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
};

// Main Quiz Page Component that can be used directly
const QuizPage: React.FC<{ quizId: string; questionType?: string }> = (props) => {
  return <QuizPageContent {...props} />;
};

export default QuizPage;

// Define list of available question types for easy import elsewhere
export const availableQuestionTypes = [
  { type: 'single_selection', name: 'Single Selection' },
  { type: 'multi', name: 'Multiple Selection' },
  { type: 'drag_and_drop', name: 'Drag and Drop' },
  { type: 'dropdown_selection', name: 'Dropdown' },
  { type: 'order', name: 'Order' },
  { type: 'yes_no', name: 'Yes/No' },
  { type: 'yesno_multi', name: 'Yes/No Multi' }
];
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuiz } from '../context/QuizContext';
import { QuizService } from '../services/quizService';
import QuestionCard from '../components/QuestionCard';
import QuizProgress from '../components/QuizProgress';
import QuizNavigation from '../components/QuizNavigation';
import QuizCompletionSummary from '../components/QuizCompletionSummary';
import SpacedRepetitionToggle from '../components/SpacedRepetitionToggle';
import { useQuizAutoSave } from '@/app/hooks/useQuizAutoSave';
import { ResumeQuizPrompt } from '../components/ResumeQuizPrompt';
import { SaveStatusIndicator } from '../components/SaveStatusIndicator';
// Using the session hook that works in this project
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Quiz Runner Component
const QuizPageContent: React.FC<{ 
  quizId: string; 
  questionType?: string; 
  spacedRepetitionMode?: boolean; 
}> = ({ quizId, questionType, spacedRepetitionMode }) => {
  const { state, dispatch, loadProgress, deleteProgress } = useQuiz();
  const [user, setUser] = useState<any>(null);
  const supabase = createClientComponentClient();
  
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
  const lastLoadedQuizRef = useRef({ quizId: '', questionType: '', userId: '' });
  
  // Memoize loadProgress function to prevent it from causing re-renders
  const memoizedLoadProgress = useCallback(loadProgress, []);
  
  // Load quiz data and check for existing progress when component mounts or important params change
  useEffect(() => {
    // Skip if nothing important has changed
    const currentUserId = user?.id || '';
    if (
      quizId === lastLoadedQuizRef.current.quizId &&
      questionType === lastLoadedQuizRef.current.questionType &&
      currentUserId === lastLoadedQuizRef.current.userId
    ) {
      return;
    }
    
    // Update the ref with current values to track what we've loaded
    lastLoadedQuizRef.current = {
      quizId: quizId || '',
      questionType: questionType || '',
      userId: currentUserId,
    };
    
    const loadQuizAndProgress = async () => {
      if (!quizId) return;
      
      dispatch({ type: 'LOAD_QUIZ_START' });
      
      try {
        // First check for existing progress if user is authenticated
        let progress = null;
        if (user) {
          progress = await memoizedLoadProgress(quizId, questionType);
          
          if (progress) {
            // Save progress data to show the resume prompt
            setSavedProgress({
              ...progress,
              lastSavedAt: new Date(), // This would ideally come from the API
            });
            setShowResumePrompt(true);
          }
        }

        // Load the quiz data regardless
        const quizData = await QuizService.fetchQuizById(quizId, questionType, spacedRepetitionMode);
        dispatch({ type: 'LOAD_QUIZ_SUCCESS', payload: quizData });
        
        // If we're showing the resume prompt, don't apply progress yet
        // It will be applied when the user clicks "Resume"
      } catch (error: any) {
        console.error("Error fetching quiz data:", error);
        dispatch({ 
          type: 'LOAD_QUIZ_FAILURE', 
          payload: error.message || 'Error fetching quiz.' 
        });
      }
    };
    
    loadQuizAndProgress();
  }, [quizId, questionType, user, dispatch, memoizedLoadProgress]);

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
      await deleteProgress(quizId, questionType);
    }
    
    // Reset the quiz state
    dispatch({ type: 'RESET_QUIZ' });
    setShowResumePrompt(false);
  };

  // Loading states
  if (state.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-custom-light-bg">
        <p className="text-xl text-custom-dark-blue">Loading quiz...</p>
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
    const isSpacedRepetition = QuizService.isSpacedRepetitionQuiz(state.quiz);
    
    return (
      <div className="min-h-screen bg-custom-light-bg py-6 px-4 md:px-6">
        <div className="quiz-container max-w-3xl mx-auto">
          <header className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-custom-dark-blue mb-3 relative inline-block pb-2">
              {state.quiz.title}
              <span className="absolute left-1/4 bottom-0 w-1/2 h-1 bg-primary-gradient rounded-rounded-full"></span>
            </h1>
            
            {/* Only show filters for regular quizzes, not spaced repetition */}
            {!isSpacedRepetition && (
              <div className="mb-6">
                <div className="flex flex-wrap justify-center gap-2 mb-2">
                  <Link 
                    href={`/quiz/${quizId}`} 
                    className={`px-3 py-1 rounded-full text-sm ${!questionType ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    All Questions
                  </Link>
                  <Link 
                    href={`/quiz/${quizId}/type/single_selection`}
                    className={`px-3 py-1 rounded-full text-sm ${questionType === 'single_selection' ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    Single Selection
                  </Link>
                  {/* ... other question types ... */}
                </div>
              </div>
            )}
          </header>
          
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            {isSpacedRepetition ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-xl font-semibold mb-4">Great job! All caught up!</h2>
                <p className="text-gray-600 mb-4">You have no questions due for review right now.</p>
                <p className="text-sm text-gray-500 mb-6">
                  Questions will become available for review as your spaced repetition intervals expire.
                </p>
                <div className="flex justify-center gap-4">
                  <Link 
                    href="/browse" 
                    className="px-6 py-2 bg-custom-primary text-white rounded-lg hover:bg-custom-primary/90 transition-colors"
                  >
                    Browse Quizzes
                  </Link>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-6 py-2 border border-custom-primary text-custom-primary rounded-lg hover:bg-custom-primary/10 transition-colors"
                  >
                    Check Again
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">No questions found</h2>
                <p>There are no questions available with this filter.</p>
                <Link href={`/quiz/${quizId}`} className="mt-4 inline-block text-custom-primary hover:underline">
                  View all questions
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Get current question
  const currentQuestion = state.questions[state.currentQuestionIndex];
  const isSpacedRepetition = QuizService.isSpacedRepetitionQuiz(state.quiz);
  
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
      <div className="min-h-screen bg-custom-light-bg py-6 px-4 md:px-6">
        <div className="quiz-container max-w-3xl mx-auto">
          <header className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-custom-dark-blue mb-3 relative inline-block pb-2">
              {state.quiz.title}
              <span className="absolute left-1/4 bottom-0 w-1/2 h-1 bg-primary-gradient rounded-rounded-full"></span>
            </h1>
          </header>
          
          <QuizCompletionSummary quiz={state.quiz} />
        </div>
      </div>
    );
  }

  // Show the quiz
  return (
    <div className="min-h-screen bg-custom-light-bg py-6 px-4 md:px-6">
      <div className="quiz-container max-w-3xl mx-auto">
        <header className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-custom-dark-blue mb-3 relative inline-block pb-2">
            {state.quiz.title}
            <span className="absolute left-1/4 bottom-0 w-1/2 h-1 bg-primary-gradient rounded-rounded-full"></span>
          </h1>
        </header>

        {/* Spaced Repetition Mode Toggle */}
        <div className="mb-6">
          <SpacedRepetitionToggle 
            quizId={quizId} 
            questionType={questionType}
          />
        </div>
          
        {/* Spaced Repetition Session Info */}
        {isSpacedRepetition && state.quiz.spaced_repetition_metadata && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <div className="flex flex-wrap justify-center gap-4 text-sm text-blue-700">
              <div className="flex items-center gap-1">
                <span className="font-medium">🧠 Spaced Repetition</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">📚 Total Questions:</span>
                <span>{state.quiz.spaced_repetition_metadata.total_count}</span>
              </div>
              {state.quiz.spaced_repetition_metadata.quiz_topic_filter && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">🏷️ Topic:</span>
                  <span>{state.quiz.spaced_repetition_metadata.quiz_topic_filter}</span>
                </div>
              )}
            </div>
          </div>
        )}
          
          {/* Filter by question type - only show for regular quizzes */}
          {!isSpacedRepetition && (
            <div className="mb-6">
              <div className="flex flex-wrap justify-center gap-2 mb-2">
                <Link 
                  href={`/quiz/${quizId}`} 
                  className={`px-3 py-1 rounded-full text-sm ${!questionType ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  All Questions
                </Link>
                <Link 
                  href={`/quiz/${quizId}/type/single_selection`}
                  className={`px-3 py-1 rounded-full text-sm ${questionType === 'single_selection' ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  Single Selection
                </Link>
                {/* ... other question type links ... */}
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <QuizProgress 
              currentIndex={state.currentQuestionIndex} 
              totalQuestions={state.questions.length} 
            />
            
            {user && <SaveStatusIndicator />}
          </div>
        
        <QuestionCard question={currentQuestion} />
        
        <QuizNavigation currentQuestionId={currentQuestion.id} />
      </div>
    </div>
  );
};

// Main Quiz Page Component that can be used directly
const QuizPage: React.FC<{ 
  quizId: string; 
  questionType?: string; 
  spacedRepetitionMode?: boolean; 
}> = (props) => {
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
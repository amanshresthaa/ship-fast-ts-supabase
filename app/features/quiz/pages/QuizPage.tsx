'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useQuiz } from '../context/QuizContext';
import { QuizService } from '../services/quizService';
import QuestionCard from '../components/QuestionCard';
import QuizProgress from '../components/QuizProgress';
import QuizNavigation from '../components/QuizNavigation';
import QuizCompletionSummary from '../components/QuizCompletionSummary';

// Quiz Runner Component
const QuizPageContent: React.FC<{ quizId: string; questionType?: string }> = ({ quizId, questionType }) => {
  const { state, dispatch } = useQuiz();

  // Load quiz data on component mount or when quizId/questionType changes
  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) return;
      
      // Reset quiz state when question type changes to avoid confusion
      dispatch({ type: 'RESET_QUIZ' });
      dispatch({ type: 'LOAD_QUIZ_START' });
      
      try {
        const quizData = await QuizService.fetchQuizById(quizId, questionType);
        dispatch({ type: 'LOAD_QUIZ_SUCCESS', payload: quizData });
      } catch (error: any) {
        console.error("Error fetching quiz data:", error);
        dispatch({ 
          type: 'LOAD_QUIZ_FAILURE', 
          payload: error.message || 'Error fetching quiz.' 
        });
      }
    };
    
    loadQuiz();
  }, [quizId, questionType, dispatch]);

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
                <Link 
                  href={`/quiz/${quizId}/type/multi`}
                  className={`px-3 py-1 rounded-full text-sm ${questionType === 'multi' ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  Multiple Selection
                </Link>
                <Link 
                  href={`/quiz/${quizId}/type/drag_and_drop`}
                  className={`px-3 py-1 rounded-full text-sm ${questionType === 'drag_and_drop' ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  Drag and Drop
                </Link>
                <Link 
                  href={`/quiz/${quizId}/type/dropdown_selection`}
                  className={`px-3 py-1 rounded-full text-sm ${questionType === 'dropdown_selection' ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  Dropdown
                </Link>
                <Link 
                  href={`/quiz/${quizId}/type/order`}
                  className={`px-3 py-1 rounded-full text-sm ${questionType === 'order' ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  Order
                </Link>
                <Link 
                  href={`/quiz/${quizId}/type/yes_no`}
                  className={`px-3 py-1 rounded-full text-sm ${questionType === 'yes_no' ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  Yes/No
                </Link>
                <Link 
                  href={`/quiz/${quizId}/type/yesno_multi`}
                  className={`px-3 py-1 rounded-full text-sm ${questionType === 'yesno_multi' ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  Yes/No Multi
                </Link>
              </div>
              <div className="mt-2">
              <Link 
                  href={`/quiz/${quizId}`}
                  className="text-custom-primary text-sm hover:underline flex items-center justify-center"
                >
                  View all question types
                </Link>
              </div>
            </div>
          </header>
          
          <div className="flex justify-center items-center p-10 bg-white rounded-xl shadow-md">
            <p className="text-xl text-custom-dark-blue">
              {questionType 
                ? `No questions of type "${questionType}" available in this quiz.` 
                : "No questions available in this quiz."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = state.questions[state.currentQuestionIndex];

  // Quiz completed state
  if (!currentQuestion && state.isQuizComplete) {
    return <QuizCompletionSummary quiz={state.quiz} />;
  }
  
  // No current question
  if (!currentQuestion) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-custom-light-bg">
        <p className="text-xl text-custom-dark-blue">No current question available.</p>
      </div>
    );
  }
  
  // Render quiz content
  return (
    <div className="min-h-screen bg-custom-light-bg py-6 px-4 md:px-6">
      <div className="quiz-container max-w-3xl mx-auto">
        <header className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-custom-dark-blue mb-3 relative inline-block pb-2">
            {state.quiz.title}
            <span className="absolute left-1/4 bottom-0 w-1/2 h-1 bg-primary-gradient rounded-rounded-full"></span>
          </h1>
          
          {/* Filter by question type */}
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            <Link 
              href={`/quiz-test/${quizId}`}
              className={`px-3 py-1 rounded-full text-sm ${!questionType ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              All Questions
            </Link>
            <Link 
              href={`/quiz-test/${quizId}/single_selection`}
              className={`px-3 py-1 rounded-full text-sm ${questionType === 'single_selection' ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Single Selection
            </Link>
            <Link 
              href={`/quiz-test/${quizId}/multi`}
              className={`px-3 py-1 rounded-full text-sm ${questionType === 'multi' ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Multiple Selection
            </Link>
            <Link 
              href={`/quiz-test/${quizId}/drag_and_drop`}
              className={`px-3 py-1 rounded-full text-sm ${questionType === 'drag_and_drop' ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Drag and Drop
            </Link>
            <Link 
              href={`/quiz-test/${quizId}/dropdown_selection`}
              className={`px-3 py-1 rounded-full text-sm ${questionType === 'dropdown_selection' ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Dropdown
            </Link>
            <Link 
              href={`/quiz-test/${quizId}/order`}
              className={`px-3 py-1 rounded-full text-sm ${questionType === 'order' ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Order
            </Link>
            <Link 
              href={`/quiz-test/${quizId}/yes_no`}
              className={`px-3 py-1 rounded-full text-sm ${questionType === 'yes_no' ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Yes/No
            </Link>
            <Link 
              href={`/quiz-test/${quizId}/yesno_multi`}
              className={`px-3 py-1 rounded-full text-sm ${questionType === 'yesno_multi' ? 'bg-custom-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Yes/No Multi
            </Link>
          </div>
          
          <QuizProgress 
            currentIndex={state.currentQuestionIndex} 
            totalQuestions={state.questions.length} 
          />
        </header>
        
        <QuestionCard question={currentQuestion} />
        
        <QuizNavigation currentQuestionId={currentQuestion.id} />
      </div>
    </div>
  );
};  // Main Quiz Page Component that can be used directly
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

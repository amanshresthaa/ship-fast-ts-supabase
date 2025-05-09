'use client';

import React, { useEffect } from 'react';
import { useQuiz } from '../context/QuizContext';
import { QuizService } from '../services/quizService';
import QuestionCard from '../components/QuestionCard';
import QuizProgress from '../components/QuizProgress';
import QuizNavigation from '../components/QuizNavigation';
import QuizCompletionSummary from '../components/QuizCompletionSummary';

// Quiz Runner Component
const QuizPageContent: React.FC<{ quizId: string }> = ({ quizId }) => {
  const { state, dispatch } = useQuiz();

  // Load quiz data on component mount
  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) return;
      
      dispatch({ type: 'LOAD_QUIZ_START' });
      
      try {
        const quizData = await QuizService.fetchQuizById(quizId);
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
  }, [quizId, dispatch]);

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
  if (!state.quiz || state.questions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-custom-light-bg">
        <p className="text-xl text-custom-dark-blue">Quiz not found or no questions available.</p>
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
};

// Main Quiz Page Component that can be used directly
const QuizPage: React.FC<{ quizId: string }> = (props) => {
  return <QuizPageContent {...props} />;
};

export default QuizPage;

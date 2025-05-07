'use client';

import React, { useEffect } from 'react';
import { QuizProvider, useQuiz } from '../../context/QuizContext'; // Path seems OK
import QuestionCard from '../../components/QuestionCard'; // Corrected path
// fetchQuizById is not directly used here anymore, it will be used in the API route
// import { fetchQuizById } from '../../lib/quizService'; // Corrected path, but commented out

const QuizRunner: React.FC<{ quizId: string }> = ({ quizId }) => {
  const { state, dispatch } = useQuiz();

  useEffect(() => {
    if (quizId) {
      dispatch({ type: 'LOAD_QUIZ_START' });
      // In a real app, you would call an API route here
      // which internally uses fetchQuizById from quizService.ts.
      // For now, to demonstrate, we are directly calling it.
      // This has implications: quizService.ts uses server-side env vars and Supabase client.
      // This will NOT work directly on the client if quizService.ts is not refactored
      // or if fetchQuizById is not exposed via an API endpoint.
      
      // TEMPORARY: Simulating API call for now for UI structure
      // Replace this with actual API call
      const loadQuiz = async () => {
        try {
          // This direct call to fetchQuizById from client won't work with server-side Supabase client.
          // const quizData = await fetchQuizById(quizId);
          // Instead, this needs to be an API call:
          const response = await fetch(`/api/quiz/${quizId}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch quiz: ${response.statusText}`);
          }
          const quizData = await response.json();

          if (quizData && !quizData.error) {
            dispatch({ type: 'LOAD_QUIZ_SUCCESS', payload: quizData });
          } else {
            dispatch({ type: 'LOAD_QUIZ_FAILURE', payload: quizData.error || 'Failed to load quiz data.' });
          }
        } catch (error: any) {
          console.error("Error fetching quiz data:", error);
          dispatch({ type: 'LOAD_QUIZ_FAILURE', payload: error.message || 'Error fetching quiz.' });
        }
      };
      loadQuiz();
    }
  }, [quizId, dispatch]);

  if (state.isLoading) return <div className="flex justify-center items-center h-screen"><p className="text-xl">Loading quiz...</p></div>;
  if (state.error) return <div className="flex justify-center items-center h-screen"><p className="text-xl text-red-500">Error: {state.error}</p></div>;
  if (!state.quiz || state.questions.length === 0) return <div className="flex justify-center items-center h-screen"><p className="text-xl">Quiz not found or no questions available.</p></div>;

  const currentQuestion = state.questions[state.currentQuestionIndex];

  if (!currentQuestion) {
    // This case might be hit if currentQuestionIndex is out of bounds after quiz load or if questions array is empty
    // Or if quiz is complete and we want to show a summary
    if(state.isQuizComplete) {
        return (
            <div className="container mx-auto p-4 text-center">
                <h1 className="text-3xl font-bold mb-4 text-green-600">Quiz Completed!</h1>
                {/* TODO: Display score or summary here */}
                <p className="text-lg">You have completed the quiz: {state.quiz.title}.</p>
                <button 
                    onClick={() => dispatch({ type: 'RESET_QUIZ' })} 
                    className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Take Another Quiz (Reset)
                </button>
            </div>
        );
    }
    return <div className="flex justify-center items-center h-screen"><p className="text-xl">No current question available.</p></div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2 text-center">{state.quiz.title}</h1>
      <p className="text-sm text-gray-600 mb-6 text-center">Question {state.currentQuestionIndex + 1} of {state.questions.length}</p>
      
      <QuestionCard question={currentQuestion} />

      <div className="mt-6 flex justify-between items-center">
        <button 
          onClick={() => dispatch({ type: 'PREVIOUS_QUESTION' })}
          disabled={state.currentQuestionIndex === 0}
          className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition-colors"
        >
          Previous
        </button>
        <button 
          onClick={() => {
            const isLastQuestion = state.currentQuestionIndex === state.questions.length - 1;
            // Allow submitting answer for the last question, then next will complete it.
            if (isLastQuestion) {
              // If answer for last question is already submitted, then complete quiz
              if (state.userAnswers[currentQuestion.id]) {
                 dispatch({ type: 'COMPLETE_QUIZ' });
              } else {
                // If last question but not answered, user must answer first.
                // The 'Next' button could be 'Submit Answer' or change based on context.
                // For now, we assume an answer submission via QuestionCard handles this.
                // If they click next without answering the last question, we don't automatically complete.
                // This part of logic might need refinement based on desired UX for last question.
                // A common pattern is for the last question submission to also trigger completion.
                 alert("Please submit your answer before finishing the quiz.");
              }
            } else {
              dispatch({ type: 'NEXT_QUESTION' });
            }
          }}
          // Disable if it's the last question AND it hasn't been answered yet (prevents finishing without answering last q)
          disabled={state.currentQuestionIndex === state.questions.length - 1 && !state.userAnswers[currentQuestion.id]}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {state.currentQuestionIndex === state.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
        </button>
      </div>
    </div>
  );
};

const QuizPage: React.FC<{ params: { quizId: string } }> = ({ params }) => {
  return (
    <QuizProvider>
      <QuizRunner quizId={params.quizId} />
    </QuizProvider>
  );
};

export default QuizPage; 
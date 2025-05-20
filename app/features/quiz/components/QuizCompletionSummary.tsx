import React from 'react';
import { useQuiz } from '../context/QuizContext';
import { Quiz } from '../../../types/quiz';

interface QuizCompletionSummaryProps {
  quiz: Quiz;
}

const QuizCompletionSummary: React.FC<QuizCompletionSummaryProps> = ({ quiz }) => {
  const { state, dispatch } = useQuiz();
  
  // Calculate quiz statistics
  const totalQuestions = state.questions.length;
  const answeredQuestions = Object.keys(state.userAnswers).length;
  const correctAnswers = Object.values(state.userAnswers).filter(answer => answer.isCorrect).length;
  const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  
  // Determine performance message
  let performanceMessage = '';
  if (scorePercentage >= 90) {
    performanceMessage = 'Excellent job! You have a great understanding of the subject!';
  } else if (scorePercentage >= 70) {
    performanceMessage = 'Good work! You have a solid understanding of the subject.';
  } else if (scorePercentage >= 50) {
    performanceMessage = 'You\'re on the right track, but you might want to review the material again.';
  } else {
    performanceMessage = 'Keep practicing! Review the material and try again for a better score.';
  }

  return (
    <div className="min-h-screen bg-custom-light-bg flex flex-col justify-center items-center p-6 animate-fade-in">
      <div className="container mx-auto p-4 md:p-8 text-center bg-white shadow-shadow-strong rounded-rounded-lg-ref max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-custom-success">Quiz Completed!</h1>
        
        <p className="text-lg md:text-xl text-custom-gray-1 mb-8">
          You have completed the quiz: <span className="font-semibold">{quiz.title}</span>.
        </p>
        
        <div className="score-summary bg-gray-50 p-6 rounded-lg mb-8">
          <div className="score-circle mx-auto mb-4 w-32 h-32 rounded-full bg-primary-gradient flex items-center justify-center">
            <span className="text-white text-3xl font-bold">{scorePercentage}%</span>
          </div>
          
          <div className="score-details text-left mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="stat-item">
              <p className="text-custom-gray-2">Total Questions</p>
              <p className="text-xl font-semibold text-custom-dark-blue">{totalQuestions}</p>
            </div>
            <div className="stat-item">
              <p className="text-custom-gray-2">Answered</p>
              <p className="text-xl font-semibold text-custom-dark-blue">{answeredQuestions}</p>
            </div>
            <div className="stat-item">
              <p className="text-custom-gray-2">Correct</p>
              <p className="text-xl font-semibold text-custom-success">{correctAnswers}</p>
            </div>
            <div className="stat-item">
              <p className="text-custom-gray-2">Incorrect</p>
              <p className="text-xl font-semibold text-custom-error">{answeredQuestions - correctAnswers}</p>
            </div>
          </div>
        </div>
        
        <div className="performance-message mb-8 p-4 bg-blue-50 text-custom-primary border border-custom-primary rounded-lg">
          {performanceMessage}
        </div>
        
        <div className="actions flex flex-col md:flex-row justify-center gap-4">
          <button 
            onClick={() => dispatch({ type: 'RESET_QUIZ' })} 
            className="btn-secondary-custom px-8 py-3 rounded-full"
          >
            Take Another Quiz
          </button>
          
          <button 
            onClick={() => window.location.href = '/quizzes'} 
            className="btn-primary-custom px-8 py-3 rounded-full"
          >
            Browse All Quizzes
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizCompletionSummary;

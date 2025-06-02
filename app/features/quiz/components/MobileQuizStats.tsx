import React from 'react';
import { useQuiz } from '../context/QuizContext';

const MobileQuizStats: React.FC = () => {
  const { state } = useQuiz();
  
  if (!state.quiz) return null;

  const totalQuestions = state.questions.length;
  const attemptedQuestions = Object.keys(state.userAnswers).length;
  const completionPercentage = totalQuestions > 0 ? Math.round((attemptedQuestions / totalQuestions) * 100) : 0;
  const totalPoints = state.questions.reduce((sum, question) => sum + question.points, 0);

  return (
    <div className="sm:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-custom-primary rounded-full"></div>
            <span className="text-custom-gray-2 dark:text-gray-400">
              {state.currentQuestionIndex + 1}/{totalQuestions}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-custom-success rounded-full"></div>
            <span className="text-custom-gray-2 dark:text-gray-400">
              {completionPercentage}% done
            </span>
          </div>
        </div>
        <div className="text-custom-gray-2 dark:text-gray-400">
          {totalPoints} pts
        </div>
      </div>
    </div>
  );
};

export default MobileQuizStats;

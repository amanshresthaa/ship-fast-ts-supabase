import React from 'react';
import { Difficulty } from '../../../types/quiz';

interface QuestionHeaderProps {
  points: number;
  difficulty: Difficulty;
}

const QuestionHeader: React.FC<QuestionHeaderProps> = ({ points, difficulty }) => {
  const difficultyText = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  
  return (
    <div className="question-meta flex flex-col sm:flex-row gap-3 mb-6">
      <div className="meta-badge inline-flex items-center py-1.5 px-4 rounded-rounded-full font-semibold text-sm shadow-shadow-1 bg-custom-primary/[.1] text-custom-primary border-l-4 border-custom-primary">
        Points: {points}
      </div>
      <div className={`meta-badge inline-flex items-center py-1.5 px-4 rounded-rounded-full font-semibold text-sm shadow-shadow-1 bg-yellow-500/[.1] text-yellow-600 border-l-4 border-yellow-500`}>
        Difficulty: {difficultyText}
      </div>
    </div>
  );
};

export default QuestionHeader;

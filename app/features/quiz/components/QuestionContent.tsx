import React from 'react';

interface QuestionContentProps {
  question: string;
}

const QuestionContent: React.FC<QuestionContentProps> = ({ question }) => {
  return (
    <section className="question-section">
      <h2 className="text-xl md:text-2xl font-bold text-custom-dark-blue mb-6 relative inline-block pb-1.5">
        Question
        <span className="absolute left-0 bottom-0 w-10 h-0.5 bg-custom-primary rounded-rounded-full"></span>
      </h2>
      <div className="question-text text-base md:text-lg text-custom-gray-1 mb-6 whitespace-pre-wrap">
        {question}
      </div>
    </section>
  );
};

export default QuestionContent;

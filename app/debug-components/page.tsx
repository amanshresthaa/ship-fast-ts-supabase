'use client';

import React, { useState } from 'react';
import SingleSelectionComponent from '../features/quiz/components/question-types/SingleSelectionComponent';
import MultiChoiceComponent from '../features/quiz/components/question-types/MultiChoiceComponent';
import { SingleSelectionQuestion, MultiChoiceQuestion } from '../types/quiz';

// Sample questions for debugging
const singleSelectionQuestion: SingleSelectionQuestion = {
  id: 'debug-single',
  type: 'single_selection',
  question: 'Which of the following is a JavaScript framework?',
  points: 1,
  quiz_tag: 'debug',
  difficulty: 'easy',
  explanation: 'React is a JavaScript library/framework for building user interfaces.',
  feedback_correct: 'Correct! React is a JavaScript framework.',
  feedback_incorrect: 'Incorrect. React is the JavaScript framework in this list.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  options: [
    { option_id: 'A', text: 'Python' },
    { option_id: 'B', text: 'React' },
    { option_id: 'C', text: 'Java' },
    { option_id: 'D', text: 'C#' }
  ],
  correctAnswerOptionId: 'B'
};

const multiChoiceQuestion: MultiChoiceQuestion = {
  id: 'debug-multi',
  type: 'multi',
  question: 'Which of the following are JavaScript frameworks/libraries? (Select all that apply)',
  points: 2,
  quiz_tag: 'debug',
  difficulty: 'medium',
  explanation: 'React, Angular, and Vue.js are all JavaScript frameworks/libraries.',
  feedback_correct: 'Correct! You identified all the JavaScript frameworks correctly.',
  feedback_incorrect: 'Incorrect. React, Angular, and Vue.js are the JavaScript frameworks in this list.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  options: [
    { option_id: 'A', text: 'React' },
    { option_id: 'B', text: 'Python' },
    { option_id: 'C', text: 'Angular' },
    { option_id: 'D', text: 'Vue.js' }
  ],
  correctAnswerOptionIds: ['A', 'C', 'D']
};

const DebugComponentsPage: React.FC = () => {
  const [singleSelectionAnswer, setSingleSelectionAnswer] = useState<string | undefined>();
  const [multiChoiceAnswers, setMultiChoiceAnswers] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  
  const resetAnswers = () => {
    setSingleSelectionAnswer(undefined);
    setMultiChoiceAnswers([]);
    setIsSubmitted(false);
    setShowCorrectAnswer(false);
  };
  
  return (
    <div className="min-h-screen bg-custom-light-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-custom-dark-blue">
          Question Components Debug Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-custom-primary">Control Panel</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
              onClick={resetAnswers}
            >
              Reset Answers
            </button>
            <button
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              onClick={() => setIsSubmitted(!isSubmitted)}
            >
              {isSubmitted ? 'Unsubmit Answers' : 'Submit Answers'}
            </button>
            <button
              className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded"
              onClick={() => setShowCorrectAnswer(!showCorrectAnswer)}
            >
              {showCorrectAnswer ? 'Hide Correct Answers' : 'Show Correct Answers'}
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-medium mb-2">Current State:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Single Selection Answer:</strong> {singleSelectionAnswer || 'None'}</p>
                <p><strong>Is Submitted:</strong> {isSubmitted ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p><strong>Multi Choice Answers:</strong> {multiChoiceAnswers.length ? multiChoiceAnswers.join(', ') : 'None'}</p>
                <p><strong>Show Correct Answer:</strong> {showCorrectAnswer ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-12">
          {/* Single Selection Component */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-custom-dark-blue border-b pb-2">
              Single Selection Component
            </h2>
            <div className="mb-4">
              <p className="font-medium text-lg">{singleSelectionQuestion.question}</p>
            </div>
            <SingleSelectionComponent 
              question={singleSelectionQuestion}
              onAnswerSelect={setSingleSelectionAnswer}
              selectedOptionId={singleSelectionAnswer}
              isSubmitted={isSubmitted}
              showCorrectAnswer={showCorrectAnswer}
            />
          </div>
          
          {/* Multi Choice Component */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-custom-dark-blue border-b pb-2">
              Multi Choice Component
            </h2>
            <div className="mb-4">
              <p className="font-medium text-lg">{multiChoiceQuestion.question}</p>
            </div>
            <MultiChoiceComponent 
              question={multiChoiceQuestion}
              onAnswerSelect={setMultiChoiceAnswers}
              selectedOptionIds={multiChoiceAnswers}
              isSubmitted={isSubmitted}
              showCorrectAnswer={showCorrectAnswer}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugComponentsPage;

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuiz } from '../features/quiz/context/QuizContext';
import { Quiz, QuestionType } from '../types/quiz';

// Mock quiz metadata
const mockQuiz: Quiz = {
  id: 'question-types-demo',
  title: 'Question Types Demo',
  description: 'Demonstration of all available question types',
  difficulty: 'medium',
  quiz_topic: 'question-types-demo',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  questions: [],
};

// Sample questions for each type
const questionTypeSamples = [
  {
    id: 'single-selection-demo',
    type: 'single_selection',
    question: 'Which of these is a cloud service provider?',
    points: 1,
    quiz_tag: 'question-types-demo',
    difficulty: 'easy',
    explanation: 'AWS (Amazon Web Services) is a cloud service provider.',
    feedback_correct: 'Correct! AWS is a cloud service provider.',
    feedback_incorrect: 'Incorrect. AWS is the cloud service provider in this list.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    options: [
      { option_id: 'A', text: 'AWS' },
      { option_id: 'B', text: 'Windows 11' },
      { option_id: 'C', text: 'Firefox' },
      { option_id: 'D', text: 'MS Office' }
    ],
    correctAnswerOptionId: 'A'
  },
  {
    id: 'multi-choice-demo',
    type: 'multi',
    question: 'Which of these are cloud service providers? (Select all that apply)',
    points: 2,
    quiz_tag: 'question-types-demo',
    difficulty: 'medium',
    explanation: 'AWS, Azure, and Google Cloud are all cloud service providers.',
    feedback_correct: 'Correct! AWS, Azure, and Google Cloud are all cloud service providers.',
    feedback_incorrect: 'Incorrect. AWS, Azure, and Google Cloud are the cloud service providers in this list.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    options: [
      { option_id: 'A', text: 'AWS' },
      { option_id: 'B', text: 'Azure' },
      { option_id: 'C', text: 'Windows 11' },
      { option_id: 'D', text: 'Google Cloud' }
    ],
    correctAnswerOptionIds: ['A', 'B', 'D']
  }
  // More question types can be added here
];

const QuestionTypesPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<QuestionType | null>(null);
  
  const availableTypes: Array<{
    type: QuestionType;
    name: string;
    description: string;
    available: boolean;
  }> = [
    {
      type: 'single_selection',
      name: 'Single Selection',
      description: 'User selects one correct answer from multiple choices.',
      available: true
    },
    {
      type: 'multi',
      name: 'Multiple Selection',
      description: 'User selects multiple correct answers from multiple choices.',
      available: true
    },
    {
      type: 'drag_and_drop',
      name: 'Drag and Drop',
      description: 'User matches items by dragging them to their corresponding targets.',
      available: false
    },
    {
      type: 'dropdown_selection',
      name: 'Dropdown Selection',
      description: 'User selects answers from dropdown menus within text.',
      available: true // Updated to true
    },
    {
      type: 'order',
      name: 'Ordering',
      description: 'User arranges items in the correct sequence.',
      available: true
    },
    {
      type: 'yes_no',
      name: 'Yes/No',
      description: 'User answers a question with yes or no.',
      available: false
    },
    {
      type: 'yesno_multi',
      name: 'Multiple Yes/No',
      description: 'User answers multiple statements with yes or no.',
      available: false
    }
  ];
  
  return (
    <div className="min-h-screen bg-custom-light-bg py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-12 text-custom-dark-blue">
          Available Question Types
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableTypes.map((typeInfo) => (
            <div 
              key={typeInfo.type}
              className={`bg-white p-6 rounded-lg shadow-lg transition-all duration-300 
                ${typeInfo.available 
                  ? 'cursor-pointer hover:shadow-xl transform hover:-translate-y-1' 
                  : 'opacity-60 cursor-not-allowed'
                }`}
              onClick={() => typeInfo.available && setSelectedType(typeInfo.type)}
            >
              <h2 className="text-xl font-bold mb-2 text-custom-primary">{typeInfo.name}</h2>
              <p className="text-gray-600 mb-4">{typeInfo.description}</p>
              <div className={`px-4 py-2 rounded-full text-sm font-medium text-center ${
                typeInfo.available 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
              }`}>
                {typeInfo.available ? 'Available' : 'Coming Soon'}
              </div>
            </div>
          ))}
        </div>
        
        {selectedType && (
          <div className="mt-12 bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-custom-dark-blue">
              {availableTypes.find(t => t.type === selectedType)?.name} Example
            </h2>
            
            {/* Display sample question based on selected type */}
            <div className="mb-8">
              {/* We would render the sample question here */}
              <p className="text-lg font-medium text-center text-custom-primary">
                Click the buttons below to see demos of this question type
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <Link
                href={`/question-types-demo/${selectedType}`}
                className="bg-custom-primary hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg text-center"
              >
                See Interactive Demo
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionTypesPage;

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { availableQuestionTypes } from '../features/quiz/pages/QuizPage';

// Sample quizzes - in a real implementation you'd fetch these from an API
const SAMPLE_QUIZZES = [
  { id: 'azure-a102', title: 'Microsoft Azure A102 Certification' },
  { id: 'aws-fundamentals', title: 'AWS Cloud Fundamentals' },
  { id: 'react-basics', title: 'React Basics Quiz' },
];

export default function QuizTypesPage() {
  const [quizzes, setQuizzes] = useState(SAMPLE_QUIZZES);
  const [isLoading, setIsLoading] = useState(false);
  
  // In a real implementation, you'd fetch quizzes from the API
  // useEffect(() => {
  //   const fetchQuizzes = async () => {
  //     setIsLoading(true);
  //     try {
  //       const response = await fetch('/api/quizzes');
  //       const data = await response.json();
  //       setQuizzes(data);
  //     } catch (error) {
  //       console.error("Error fetching quizzes:", error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   
  //   fetchQuizzes();
  // }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-custom-light-bg flex items-center justify-center">
        <p className="text-xl text-custom-dark-blue">Loading quizzes...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-custom-light-bg py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-custom-dark-blue">
          Quizzes with Question Type Filtering
        </h1>
        
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-custom-primary">{quiz.title}</h2>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 text-gray-700">Take quiz with all question types:</h3>
              <Link 
                href={`/quiz-test/${quiz.id}`}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-4"
              >
                All Questions
              </Link>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-700">Filter by question type:</h3>
              <div className="flex flex-wrap gap-2">
                {availableQuestionTypes.map((type) => (
                  <Link
                    key={type.type}
                    href={`/quiz-test/${quiz.id}/${type.type}`}
                    className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    {type.name} Questions
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

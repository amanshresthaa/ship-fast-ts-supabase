'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { availableQuestionTypes } from '../features/quiz/pages/QuizPage';

// Sample quizzes - replace with API fetch as needed
const SAMPLE_QUIZZES = [
  { id: 'azure-a102', title: 'Microsoft Azure A102 Certification' },
  { id: 'aws-fundamentals', title: 'AWS Cloud Fundamentals' },
  { id: 'react-basics', title: 'React Basics Quiz' },
];

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState(SAMPLE_QUIZZES);
  const [isLoading, setIsLoading] = useState(false);

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
          Available Quizzes
        </h1>
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-custom-primary">{quiz.title}</h2>
            
            {/* Quiz Mode Selection */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-3 text-gray-700">🎯 Select Quiz Mode:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Regular Mode */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">📝</span>
                    <h4 className="font-semibold text-gray-800">Regular Mode</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Standard quiz experience with immediate feedback</p>
                  <Link
                    href={`/quiz/${quiz.id}`}
                    className="inline-block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Regular Quiz
                  </Link>
                </div>

                {/* Spaced Repetition Mode */}
                <div className="bg-white p-4 rounded-lg border border-green-200 hover:border-green-400 transition-colors">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">🧠</span>
                    <h4 className="font-semibold text-gray-800">Spaced Repetition Mode</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Adaptive learning with SM-2 algorithm for long-term retention
                  </p>
                  <Link
                    href={`/quiz/${quiz.id}?spacedRepetition=true`}
                    className="inline-block w-full px-4 py-2 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Start Smart Learning
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-700">🔍 Filter by Question Type:</h3>
              <div className="flex flex-wrap gap-2">
                {availableQuestionTypes.map((type) => (
                  <Link
                    key={type.type}
                    href={`/quiz/${quiz.id}/type/${type.type}`}
                    className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    {type.name} Questions
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        {/* Spaced Repetition Info Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">🧠 About Spaced Repetition Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">✨ Features:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• SM-2 algorithm for optimal review timing</li>
                <li>• Adaptive difficulty based on performance</li>
                <li>• Long-term retention tracking</li>
                <li>• Personalized learning analytics</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">📊 How it works:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Questions adapt to your performance</li>
                <li>• Difficult questions appear more frequently</li>
                <li>• Mastered questions have longer intervals</li>
                <li>• Progress is tracked across sessions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

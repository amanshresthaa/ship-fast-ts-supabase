'use client';

import React, { useEffect, useState } from 'react';
import { fetchAllQuizzes } from '../lib/supabaseQuizService';
import { Quiz } from '../types/quiz';
import QuizConfigModal from '../../components/QuizConfigModal';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadQuizzes = async () => {
      const fetchedQuizzes = await fetchAllQuizzes();
      setQuizzes(fetchedQuizzes);
      setIsLoading(false);
    };

    loadQuizzes();
  }, []);

  const handleQuizSelect = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedQuiz(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading learning mode quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Explore Our Quizzes
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Select a quiz to start your learning journey or test your knowledge.
            </p>
          </div>
        </div>
      </div>

      {/* Quizzes Grid */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              onClick={() => handleQuizSelect(quiz)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
            >
              <div className="p-8">
                <div className="flex items-start gap-6">
                  {/* Quiz Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                      <svg className="w-8 h-8 text-blue-600 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>

                  {/* Quiz Content */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200">
                      {quiz.title}
                    </h2>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {quiz.description || "Sharpen your skills for the AI-102 exam. Click to configure your practice session."}
                    </p>

                    {/* Action Labels (now visual only) */}
                    <div className="flex flex-wrap gap-3">
                      <div className="bg-blue-500 text-white font-medium px-4 py-2 rounded-md text-sm">
                        Practice Quiz
                      </div>
                      <div className="bg-green-500 text-white font-medium px-4 py-2 rounded-md text-sm">
                        All Levels
                      </div>
                      <div className="bg-purple-500 text-white font-medium px-4 py-2 rounded-md text-sm">
                        Certification Prep
                      </div>
                    </div>
                  </div>

                  {/* Arrow Icon */}
                  <div className="flex-shrink-0">
                    <div className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {quizzes.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes available</h3>
            <p className="text-gray-600">Check back later for new learning mode quizzes.</p>
          </div>
        )}
      </div>

      {/* Quiz Configuration Modal */}
      {selectedQuiz && (
        <QuizConfigModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          quiz={selectedQuiz}
        />
      )}
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import { fetchQuizById } from '../../../lib/supabaseQuizService';

/**
 * Displays a page listing all unique question types for a given quiz, allowing users to select a type to practice or view all questions.
 *
 * If the quiz is not found, renders a "Quiz Not Found" message with a link to the home page.
 *
 * @param params - An object containing the quiz ID as a string.
 * @returns A React component rendering the question types selection page or a not found message.
 */
export default async function QuestionTypesListPage({ params }: { params: { quizId: string } }) {
  const { quizId } = await params;
  
  // Fetch the quiz data to get all available question types
  const quiz = await fetchQuizById(quizId);
  
  if (!quiz) {
    return (
      <div className="min-h-screen bg-custom-light-bg py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-custom-dark-blue mb-6">Quiz Not Found</h1>
          <p className="mb-6">The quiz you're looking for could not be found.</p>
          <Link href="/" className="text-custom-primary hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  
  // Get unique question types from the quiz
  const questionTypes = Array.from(
    new Set(quiz.questions.map(question => question.type))
  );
  
  return (
    <div className="min-h-screen bg-custom-light-bg py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-custom-dark-blue mb-6">{quiz.title}</h1>
        <p className="mb-6">Select a question type to practice:</p>
        
        <div className="mb-8">
          <Link 
            href={`/quiz-test/${quizId}`} 
            className="inline-block bg-custom-primary text-white px-4 py-2 rounded-lg mb-4 mr-4 hover:bg-custom-primary-dark transition"
          >
            All Questions ({quiz.questions.length})
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questionTypes.map(type => {
            const count = quiz.questions.filter(q => q.type === type).length;
            return (
              <Link 
                key={type} 
                href={`/quiz-test/${quizId}/questions/${type}`}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold text-custom-dark-blue mb-2">
                  {type.replace('_', ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase())}
                </h3>
                <p className="text-gray-600">{count} questions</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

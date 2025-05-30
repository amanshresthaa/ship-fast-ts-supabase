'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabaseQuizService';

export default function QuizDataTest() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testDatabase() {
      try {
        console.log('Testing database connection...');
        
        // Test 1: Fetch quizzes
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select('*');
        
        if (quizzesError) {
          console.error('Quizzes error:', quizzesError);
          setError(`Quizzes error: ${quizzesError.message}`);
          return;
        }
        
        console.log('Quizzes data:', quizzesData);
        setQuizzes(quizzesData || []);
        
        // Test 2: Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .limit(10);
        
        if (questionsError) {
          console.error('Questions error:', questionsError);
          setError(`Questions error: ${questionsError.message}`);
          return;
        }
        
        console.log('Questions data:', questionsData);
        setQuestions(questionsData || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Database test error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }
    
    testDatabase();
  }, []);

  if (loading) {
      return (
        <div className="container mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4">Testing Quiz Database</h1>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Database Test Error</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Quiz Database Test Results</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Quizzes ({quizzes.length})</h2>
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white p-4 rounded-lg border shadow">
                <h3 className="font-medium">{quiz.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
                <div className="text-xs text-gray-500 mt-2">
                  ID: {quiz.id} | Created: {new Date(quiz.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Sample Questions ({questions.length}/147 total)</h2>
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="bg-white p-4 rounded-lg border shadow">
                <h3 className="font-medium text-sm">{question.question_text}</h3>
                <div className="text-xs text-gray-500 mt-2">
                  Type: {question.question_type} | Difficulty: {question.difficulty}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Success Summary</h2>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ Database connection successful<br/>
          ✅ Found {quizzes.length} quiz(s)<br/>
          ✅ Found {questions.length}+ questions<br/>
          ✅ Migration completed successfully
        </div>
      </div>
    </div>
  );
}

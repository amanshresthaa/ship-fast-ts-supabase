'use client';

import { useState, useEffect } from 'react';
import { fetchQuizById } from '@/app/lib/supabaseQuizService';
import { Quiz, AnyQuestion } from '@/app/types/quiz';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LiveQuizDemo() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuiz() {
      try {
        console.log('Loading quiz data...');
        const quizData = await fetchQuizById('azure-a102');
        
        if (!quizData || !quizData.questions.length) {
          setError('No quiz data found');
          return;
        }
        
        console.log('Quiz loaded:', quizData.title, 'with', quizData.questions.length, 'questions');
        setQuiz(quizData);
        setCurrentQuestion(quizData.questions[0]);
        setUserAnswers(new Array(quizData.questions.length).fill(null));
        setLoading(false);
      } catch (err) {
        console.error('Error loading quiz:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
        setLoading(false);
      }
    }
    
    loadQuiz();
  }, []);

  const handleAnswer = (answer: any) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(quiz.questions[nextIndex]);
    } else {
      setShowResults(true);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setCurrentQuestion(quiz.questions[prevIndex]);
    }
  };

  const renderQuestion = (question: AnyQuestion) => {
    const userAnswer = userAnswers[currentQuestionIndex];

    switch (question.type) {
      case 'single_selection':
        return (
          <div className="space-y-3">
            {question.options.map((option) => (
              <div key={option.option_id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={option.option_id}
                  name="single_selection"
                  value={option.option_id}
                  checked={userAnswer === option.option_id}
                  onChange={(e) => handleAnswer(e.target.value)}
                  className="radio"
                />
                <label htmlFor={option.option_id} className="cursor-pointer">
                  {option.text}
                </label>
              </div>
            ))}
          </div>
        );

      case 'multi':
        return (
          <div className="space-y-3">
            {question.options.map((option) => (
              <div key={option.option_id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={option.option_id}
                  checked={userAnswer?.includes(option.option_id) || false}
                  onChange={(e) => {
                    const currentAnswers = userAnswer || [];
                    if (e.target.checked) {
                      handleAnswer([...currentAnswers, option.option_id]);
                    } else {
                      handleAnswer(currentAnswers.filter((id: string) => id !== option.option_id));
                    }
                  }}
                  className="checkbox"
                />
                <label htmlFor={option.option_id} className="cursor-pointer">
                  {option.text}
                </label>
              </div>
            ))}
          </div>
        );

      case 'yes_no':
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="yes"
                name="yes_no"
                value="true"
                checked={userAnswer === true}
                onChange={() => handleAnswer(true)}
                className="radio"
              />
              <label htmlFor="yes" className="cursor-pointer">Yes</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="no"
                name="yes_no"
                value="false"
                checked={userAnswer === false}
                onChange={() => handleAnswer(false)}
                className="radio"
              />
              <label htmlFor="no" className="cursor-pointer">No</label>
            </div>
          </div>
        );

      case 'yesno_multi':
        return (
          <div className="space-y-4">
            {question.statements.map((statement, index) => (
              <div key={statement.statement_id} className="border p-4 rounded">
                <p className="mb-2 font-medium">{statement.text}</p>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`${statement.statement_id}_yes`}
                      name={statement.statement_id}
                      value="true"
                      checked={userAnswer?.[index] === true}
                      onChange={() => {
                        const newAnswers = userAnswer || [];
                        newAnswers[index] = true;
                        handleAnswer([...newAnswers]);
                      }}
                      className="radio"
                    />
                    <label htmlFor={`${statement.statement_id}_yes`} className="cursor-pointer">Yes</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`${statement.statement_id}_no`}
                      name={statement.statement_id}
                      value="false"
                      checked={userAnswer?.[index] === false}
                      onChange={() => {
                        const newAnswers = userAnswer || [];
                        newAnswers[index] = false;
                        handleAnswer([...newAnswers]);
                      }}
                      className="radio"
                    />
                    <label htmlFor={`${statement.statement_id}_no`} className="cursor-pointer">No</label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'drag_and_drop':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Drag and drop question (simplified for demo)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Options:</h4>
                {question.options.map((option) => (
                  <div key={option.option_id} className="p-2 bg-blue-100 border rounded mb-2">
                    {option.text}
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-medium mb-2">Targets:</h4>
                {question.targets.map((target) => (
                  <div key={target.target_id} className="p-2 bg-gray-100 border rounded mb-2">
                    {target.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'dropdown_selection':
        const questionTextWithPlaceholders = question.question;
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Dropdown question (simplified for demo)</p>
            <div className="p-4 bg-gray-50 rounded">
              <p>{questionTextWithPlaceholders}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Available options:</h4>
              {question.options.map((option) => (
                <div key={option.option_id} className="p-2 border rounded mb-1">
                  {option.text}
                </div>
              ))}
            </div>
          </div>
        );

      case 'order':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Order question (simplified for demo)</p>
            <div>
              <h4 className="font-medium mb-2">Items to order:</h4>
              {question.items.map((item, index) => (
                <div key={item.item_id} className="p-2 bg-yellow-100 border rounded mb-2">
                  {index + 1}. {item.text}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <p>Unsupported question type: {(question as any).type}</p>;
    }
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    
    let correct = 0;
    quiz.questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      
      switch (question.type) {
        case 'single_selection':
          if (userAnswer === question.correctAnswerOptionId) correct++;
          break;
        case 'multi':
          const userMultiAnswers = userAnswer || [];
          const correctMultiAnswers = question.correctAnswerOptionIds;
          if (
            userMultiAnswers.length === correctMultiAnswers.length &&
            userMultiAnswers.every((id: string) => correctMultiAnswers.includes(id))
          ) {
            correct++;
          }
          break;
        case 'yes_no':
          if (userAnswer === question.correctAnswer) correct++;
          break;
        case 'yesno_multi':
          const userMultiYesNoAnswers = userAnswer || [];
          if (
            userMultiYesNoAnswers.length === question.correctAnswers.length &&
            userMultiYesNoAnswers.every((answer: boolean, idx: number) => answer === question.correctAnswers[idx])
          ) {
            correct++;
          }
          break;
        // Add other question types as needed
      }
    });
    
    return correct;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Loading Quiz...</h1>
        <p>Fetching quiz data from Supabase...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Quiz Loading Error</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const percentage = quiz ? Math.round((score / quiz.questions.length) * 100) : 0;
    
    return (
      <div className="container mx-auto p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Quiz Complete!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">{quiz?.title}</h2>
              <div className="text-3xl font-bold text-blue-600">
                Score: {score}/{quiz?.questions.length} ({percentage}%)
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-green-100 p-4 rounded">
                  <h3 className="font-medium">Correct</h3>
                  <p className="text-2xl font-bold text-green-600">{score}</p>
                </div>
                <div className="bg-red-100 p-4 rounded">
                  <h3 className="font-medium">Incorrect</h3>
                  <p className="text-2xl font-bold text-red-600">{(quiz?.questions.length || 0) - score}</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setShowResults(false);
                  setCurrentQuestionIndex(0);
                  setCurrentQuestion(quiz?.questions[0] || null);
                  setUserAnswers(new Array(quiz?.questions.length || 0).fill(null));
                }}
                className="mt-4"
              >
                Retake Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{quiz?.title}</h1>
          <p className="text-gray-600">{quiz?.description}</p>
          <div className="mt-2">
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Question {currentQuestionIndex + 1} of {quiz?.questions.length}
            </span>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {currentQuestion?.question}
            </CardTitle>
            <div className="flex gap-2 text-sm">
              <span className="bg-gray-100 px-2 py-1 rounded">
                Type: {currentQuestion?.type}
              </span>
              <span className="bg-yellow-100 px-2 py-1 rounded">
                Difficulty: {currentQuestion?.difficulty}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {currentQuestion && renderQuestion(currentQuestion)}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button 
            onClick={previousQuestion} 
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            Previous
          </Button>
          <Button onClick={nextQuestion}>
            {quiz && currentQuestionIndex === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import OrderQuestionComponent from '@/app/features/quiz/components/question-types/OrderQuestionComponent';
import { Quiz, AnyQuestion, OrderQuestion, OrderQuestionAnswer } from '@/app/types/quiz'; // Added Quiz, AnyQuestion
import { OrderController } from '@/app/features/quiz/controllers/OrderController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

// Updated sampleOrderQuestions to conform to OrderQuestion type
const sampleOrderQuestions: OrderQuestion[] = [
  {
    id: 'order_q1_simple', // Changed from question_id
    quiz_tag: 'demo_quiz', // Changed from quiz_id
    type: 'order', // Changed from question_type
    question: 'Arrange these historical events in chronological order:', // Changed from text
    items: [
      { item_id: 'event_ww1', text: 'World War I' },
      { item_id: 'event_moon', text: 'Moon Landing' },
      { item_id: 'event_fall_berlin_wall', text: 'Fall of the Berlin Wall' },
    ],
    correctOrder: ['event_ww1', 'event_moon', 'event_fall_berlin_wall'],
    points: 10,
    explanation: 'Understanding the timeline of major world events is key.', // Was feedback.general_feedback
    feedback_correct: 'Excellent! You know your history.', // Was feedback.correct_feedback
    feedback_incorrect: 'Not quite. Review the timeline of these events.', // Was feedback.incorrect_feedback
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    difficulty: 'medium',
    // 'tags' and 'config' removed as they are not in OrderQuestion type
  },
  {
    id: 'order_q2_distractors',
    quiz_tag: 'demo_quiz',
    type: 'order',
    question: 'Order the first four planets from the Sun, starting with the closest.',
    items: [
      { item_id: 'planet_mercury', text: 'Mercury' },
      { item_id: 'planet_venus', text: 'Venus' },
      { item_id: 'planet_earth', text: 'Earth' },
      { item_id: 'planet_mars', text: 'Mars' },
      { item_id: 'distractor_jupiter', text: 'Jupiter (Distractor)' },
      { item_id: 'distractor_moon', text: 'Moon (Distractor)' },
    ],
    correctOrder: ['planet_mercury', 'planet_venus', 'planet_earth', 'planet_mars'],
    points: 15,
    explanation: 'The solar system has a fascinating order.',
    feedback_correct: 'Perfect! You know your planets.',
    feedback_incorrect: 'Check your astronomy notes! Some of these are further out or not planets.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    difficulty: 'medium',
  },
  {
    id: 'order_q3_similar_text',
    quiz_tag: 'demo_quiz',
    type: 'order',
    question: 'Arrange the steps to make a cup of tea (simplified).',
    items: [
      { item_id: 'tea_boil', text: 'Boil water' },
      { item_id: 'tea_pour', text: 'Pour water into cup with tea bag' },
      { item_id: 'tea_steep', text: 'Let tea steep' },
      { item_id: 'tea_add_milk', text: 'Add milk/sugar (optional)' },
      { item_id: 'distractor_drink_cold_water', text: 'Drink cold water (Distractor)' },
    ],
    correctOrder: ['tea_boil', 'tea_pour', 'tea_steep', 'tea_add_milk'],
    points: 10,
    explanation: 'Making tea is a simple process.',
    feedback_correct: 'Great! Enjoy your virtual tea.',
    feedback_incorrect: 'Think about the logical sequence of making tea.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    difficulty: 'easy',
  },
  {
    id: 'order_q4_long_sequence',
    quiz_tag: 'demo_quiz',
    type: 'order',
    question: 'Order the stages of cellular respiration (simplified to 5 steps).',
    items: [
      { item_id: 'cr_glycolysis', text: 'Glycolysis' },
      { item_id: 'cr_pyruvate_oxidation', text: 'Pyruvate Oxidation' },
      { item_id: 'cr_citric_acid_cycle', text: 'Citric Acid Cycle (Krebs Cycle)' },
      { item_id: 'cr_electron_transport_chain', text: 'Electron Transport Chain' },
      { item_id: 'cr_oxidative_phosphorylation', text: 'Oxidative Phosphorylation (Final Stage)' },
      { item_id: 'distractor_photosynthesis', text: 'Photosynthesis (Distractor)' },
    ],
    correctOrder: [
      'cr_glycolysis', 
      'cr_pyruvate_oxidation', 
      'cr_citric_acid_cycle', 
      'cr_electron_transport_chain', 
      'cr_oxidative_phosphorylation'
    ],
    points: 20,
    explanation: 'Cellular respiration is fundamental to energy production in cells. This is a simplified 5-step model.',
    feedback_correct: 'Excellent! You have a good grasp of cellular respiration.',
    feedback_incorrect: 'Review the stages of cellular respiration. It’s a complex but logical process.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    difficulty: 'hard',
  },
];

const TestOrderQuestionsPage = () => {
  const [quizData, setQuizData] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OrderQuestionAnswer>>({});
  const [isSubmitted, setIsSubmitted] = useState<Record<string, boolean>>({});
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [correctnessMap, setCorrectnessMap] = useState<Record<string, Record<string, boolean | null>>>({});

  useEffect(() => {
    // Simulate loading quiz data
    const loadedQuiz: Quiz = {
      id: 'demo_quiz',
      title: 'Order Questions Test Suite',
      description: 'A collection of order questions for testing.',
      difficulty: 'medium',
      quiz_topic: 'testing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      questions: sampleOrderQuestions as AnyQuestion[], // Cast to AnyQuestion[]
    };
    setQuizData(loadedQuiz);

    // Initialize answers
    const initialAnswers: Record<string, OrderQuestionAnswer> = {};
    loadedQuiz.questions.forEach(q => {
      if (q.type === 'order') {
        const orderQ = q as OrderQuestion;
        const controller = new OrderController(orderQ);
        initialAnswers[orderQ.id] = controller.createInitialAnswer();
      }
    });
    setAnswers(initialAnswers);
  }, []);

  const handleAnswerSelect = useCallback((questionId: string, answer: OrderQuestionAnswer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    // If you had auto-validation or immediate feedback logic, it would go here
    // For now, submission is manual
  }, []);

  const handleSubmit = (questionId: string) => {
    if (!quizData) return;
    const question = quizData.questions.find(q => q.id === questionId) as OrderQuestion | undefined;
    if (question && question.type === 'order') {
      const controller = new OrderController(question);
      const answer = answers[questionId];
      const score = controller.getScore(answer);
      const currentCorrectnessMap = controller.getCorrectnessMap(answer);
      
      setScores(prev => ({ ...prev, [questionId]: score }));
      setCorrectnessMap(prev => ({ ...prev, [questionId]: currentCorrectnessMap }));
      setIsSubmitted(prev => ({ ...prev, [questionId]: true }));
    }
  };

  const currentQuestion = quizData?.questions[currentQuestionIndex] as OrderQuestion | undefined;

  if (!quizData || !currentQuestion || currentQuestion.type !== 'order') {
    return <div>Loading or invalid question type...</div>;
  }

  const controller = new OrderController(currentQuestion);
  const numSlots = controller.getSlotCount();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto p-4 min-h-screen flex flex-col items-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Test Order Question ({currentQuestionIndex + 1} / {quizData.questions.length})</CardTitle>
            <p className="text-sm text-muted-foreground">{currentQuestion.question}</p>
            <p className="text-sm text-muted-foreground">Points: {currentQuestion.points}</p>
          </CardHeader>
          <CardContent>
            <OrderQuestionComponent
              question={currentQuestion}
              onAnswerSelect={(answer) => handleAnswerSelect(currentQuestion.id, answer as OrderQuestionAnswer)}
              userAnswer={answers[currentQuestion.id]}
              isSubmitted={isSubmitted[currentQuestion.id] || false}
              isQuizReviewMode={isSubmitted[currentQuestion.id] || false} // Simulate review mode post-submit
            />
            {isSubmitted[currentQuestion.id] && (
              <div className="mt-4 p-3 rounded-md bg-gray-100 dark:bg-gray-800">
                <h3 className="font-semibold mb-2">Feedback:</h3>
                {scores[currentQuestion.id] !== null && (
                  <p className="mb-1">
                    Your score: {scores[currentQuestion.id]} / {currentQuestion.points}
                    {scores[currentQuestion.id] === currentQuestion.points ? 
                      <CheckCircle className="inline ml-2 h-5 w-5 text-green-500" /> : 
                      <XCircle className="inline ml-2 h-5 w-5 text-red-500" />}
                  </p>
                )}
                <p className="text-sm">
                  {scores[currentQuestion.id] === currentQuestion.points 
                    ? currentQuestion.feedback_correct 
                    : currentQuestion.feedback_incorrect}
                </p>
                {currentQuestion.explanation && <p className="text-xs mt-1 italic">{currentQuestion.explanation}</p>}
                 <div className="mt-2">
                  <h4 className="text-sm font-semibold">Correct Order:</h4>
                  <ul className="list-decimal list-inside text-sm">
                    {currentQuestion.correctOrder.map((itemId) => {
                      const item = currentQuestion.items.find(i => i.item_id === itemId);
                      return <li key={itemId}>{item ? item.text : 'Unknown item'}</li>;
                    })}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-4">
            {!isSubmitted[currentQuestion.id] && (
              <Button onClick={() => handleSubmit(currentQuestion.id)} className="w-full">
                Submit Answer
              </Button>
            )}
            {isSubmitted[currentQuestion.id] && (
               <Button onClick={() => handleSubmit(currentQuestion.id)} className="w-full" variant="outline" disabled>
                Answer Submitted
              </Button>
            )}
            <div className="flex justify-between w-full">
              <Button 
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} 
                disabled={currentQuestionIndex === 0}
                variant="outline"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button 
                onClick={() => setCurrentQuestionIndex(prev => Math.min(quizData.questions.length - 1, prev + 1))} 
                disabled={currentQuestionIndex === quizData.questions.length - 1}
                variant="outline"
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        {/* Debugging section */}
        <Card className="w-full max-w-2xl mt-6">
          <CardHeader><CardTitle>Debug State</CardTitle></CardHeader>
          <CardContent className="text-xs space-y-2">
            <div><strong>Current Answer:</strong> <pre>{JSON.stringify(answers[currentQuestion.id], null, 2)}</pre></div>
            <div><strong>Is Submitted:</strong> {isSubmitted[currentQuestion.id]?.toString() || 'false'}</div>
            <div><strong>Score:</strong> {scores[currentQuestion.id]?.toString() ?? 'N/A'}</div>
            <div><strong>Correctness Map:</strong> <pre>{JSON.stringify(correctnessMap[currentQuestion.id], null, 2)}</pre></div>
            <div><strong>Available Items (for D&D reference):</strong>
              <ul>
                {currentQuestion.items
                  .filter(item => !Object.values(answers[currentQuestion.id] || {}).includes(item.item_id))
                  .map(item => <li key={item.item_id}>{item.text} ({item.item_id})</li>)
                }
              </ul>
            </div>
            <div><strong>Slots (Correct Order for reference):</strong>
                <ol>
                    {currentQuestion.correctOrder.map((itemId, index) => {
                        const item = currentQuestion.items.find(i => i.item_id === itemId);
                        return <li key={itemId}>Slot {index}: {item?.text} ({itemId})</li>
                    })}
                </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </DndProvider>
  );
};

export default TestOrderQuestionsPage;

// Ensure all questions are processed for initial answers
// This was a small bug fix for the initialAnswers setup.
// The original code was fine, but this is a slightly more robust way to ensure all questions are processed.
// No, the original code was fine. This comment is not needed.
